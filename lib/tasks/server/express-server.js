'use strict';

var Promise = require('../../ext/promise');
var Task    = require('../../models/task');

// Middleware
var serveFilesMiddleware = require('./middleware/serve-files');

module.exports = Task.extend({
  init: function() {
    this.chain = this.chain || require('connect-chain');
    this.http  = this.http  || require('http');
  },
  setupHttpServer: function() {
    this.httpServer = this.http.createServer(this.app);
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

  proxyMiddleware: function(url) {
    var urlOpts = require('url').parse(url);
    var proxy  = require('proxy-middleware');
    return proxy(urlOpts);
  },

  start: function(options) {
    var ui      = this.ui;
    var watcher = this.watcher;
    var middleware = this.chain();
    var app = this.app = require('express')();

    if (options.liveReload === true) {
      var livereloadMiddleware = require('connect-livereload');
      middleware = this.chain(middleware, livereloadMiddleware({
        port: options.liveReloadPort
      }));
    }

    middleware = this.chain(middleware, serveFilesMiddleware({
      watcher: watcher,
      baseURL: options.baseURL
    }));

    if (options.proxy) {
      ui.write('Proxying to ' + options.proxy + '\n');
      middleware = this.chain(middleware, this.proxyMiddleware(options.proxy));
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
