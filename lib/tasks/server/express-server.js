'use strict';

var http    = require('http');
var Promise = require('../../ext/promise');
var proxy   = require('proxy-middleware');
var url     = require('url');
var chain   = require('connect-chain');
var Task    = require('../../models/task');
var express = require('express');

// Middleware
var livereloadMiddleware = require('connect-livereload');
var serveFilesMiddleware = require('./middleware/serve-files');

module.exports = Task.extend({
  setupHttpServer: function() {
    this.httpServer = http.createServer(this.app);
  },

  listen: function(port, host) {
    var server = this.httpServer;
    var listen = Promise.denodeify(server.listen.bind(server));
    return listen(port, host);
  },

  processAddonMiddlewares: function(options) {
    this.project.initializeAddons();
    this.project.addons.forEach(function(addon) {
      if (addon.serverMiddleware) {
        addon.serverMiddleware({
          app: this.app,
          options: options
        });
      }
    }, this);
  },

  processAppMiddlewares: function() {
    if (this.project.has('./server')) {
      this.project.require('./server')(this.app);
    }
  },

  start: function(options) {
    var ui      = this.ui;
    var watcher = this.watcher;
    var middleware = chain();
    var app = this.app = express();

    if (options.liveReload === true) {
      middleware = chain(middleware, livereloadMiddleware({
        port: options.liveReloadPort
      }));
    }

    middleware = chain(middleware, serveFilesMiddleware({
      watcher: watcher,
      baseURL: options.baseURL
    }));

    if (options.proxy) {
      var urlopts = url.parse(options.proxy);

      ui.write('Proxying to ' + options.proxy + '\n');
      middleware = chain(middleware, proxy(urlopts));
    }

    this.processAddonMiddlewares(options);
    this.processAppMiddlewares();

    app.use(middleware);

    this.setupHttpServer();
    return this.listen(options.port, options.host)
      .then(function() {
        ui.write('Serving on http://' + options.host + ':' + options.port + '\n');
      });
  }
});
