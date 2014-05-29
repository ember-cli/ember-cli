'use strict';

var Promise = require('../../ext/promise');
var proxy   = require('proxy-middleware');
var url     = require('url');
var chain   = require('connect-chain');
var Task    = require('../../models/task');

// Middleware
var livereloadMiddleware = require('connect-livereload');
var serveFilesMiddleware = require('./middleware/serve-files');

module.exports = Task.extend({
  start: function(options) {
    var ui      = this.ui;
    var project = this.project;
    var watcher = this.watcher;
    var baseURL = project.require('./config/environment')('development').baseURL || '/';
    var middleware = chain();

    if (options.liveReload === true) {
      middleware = chain(middleware, livereloadMiddleware({
        port: options.liveReloadPort
      }));
    }

    middleware = chain(middleware, serveFilesMiddleware({
      watcher: watcher,
      baseURL: baseURL
    }));

    if (options.proxy) {
      var urlopts = url.parse(options.proxy);

      ui.write('Proxying to ' + options.proxy + '\n');
      middleware = chain(middleware, proxy(urlopts));
    }

    var server = project.require('./server')(middleware);
    var listen = Promise.denodeify(server.listen.bind(server));

    return listen(options.port, options.host)
      .then(function() {
        ui.write('Serving on http://' + options.host + ':' + options.port + '\n');
      });
  }
});
