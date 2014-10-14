'use strict';

var Promise     = require('../../ext/promise');
var Task        = require('../../models/task');
var SilentError = require('../../errors/silent');

var cleanBaseURL = require('../../utilities/clean-base-url');

module.exports = Task.extend({
  init: function() {
    this.http  = this.http  || require('http');
  },
  setupHttpServer: function() {
    this.httpServer = this.http.createServer(this.app);
  },

  listen: function(port, host) {
    var server = this.httpServer;
    return new Promise(function(resolve, reject) {
      server.listen(port, host);
      server.on('listening', resolve);
      server.on('error', reject);
    });
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

  processAppMiddlewares: function(options) {
    if (this.project.has('./server')) {
      this.project.require('./server')(this.app, options);
    }
  },

  start: function(options) {
    var ui             = this.ui;
    this.app = require('express')();
    this.setupHttpServer();

    options.project     = this.project;
    options.watcher     = this.watcher;
    options.ui          = this.ui;
    options.httpServer  = this.httpServer;

    if (options.enabledInTest) {
      this.app.all('/*', function(req, res, next) {
        res.header('Access-Control-Allow-Origin', 'http://localhost:'+options.testRunnerPort);
        next();
      });
    }

    this.processAppMiddlewares(options);
    this.processAddonMiddlewares(options);

    return this.listen(options.port, options.host)
      .then(function() {
        var baseURL = cleanBaseURL(options.baseURL);

        ui.writeLine('Serving on http://' + options.host + ':' + options.port + baseURL);
      })
      .catch(function() {
        throw new SilentError('Could not serve on http://' + options.host + ':' + options.port + '. It is either in use or you do not have permission.');
      });
  }
});
