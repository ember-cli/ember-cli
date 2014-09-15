'use strict';

var ExpressServer    = require('./server/express-server');
var Task             = require('../models/task');
var Promise          = require('../ext/promise');
var Watcher          = require('../models/watcher');
var Builder          = require('../models/builder');

module.exports = Task.extend({
  init: function() {
    this.testem = this.testem || new (require('testem'))();
  },

  invokeTestem: function (testemOptions) {
    return new Promise(function(resolve) {
      this.testem.startCI(testemOptions, resolve);
    }.bind(this));
  },

  run: function(options) {
    var testemOptions = {
      file: options.configFile,
      port: options.port,
      cwd: options.outputPath
    };

    var expressServerOptions = {
      host: options.expressServerHost,
      port: options.expressServerPort,
      liveReloadPort: options.expressServerPort - 4200 + 35729,
      baseURL: this.project.config('test').baseURL || '/',
      liveReload: true,
      watcher: 'events'
    };

    var builder = new Builder({
      outputPath: options.outputPath,
      project: this.project,
      environment: options.environment
    });

    var watcher = new Watcher({
      ui: this.ui,
      builder: builder,
      analytics: this.analytics,
      options: options
    });

    var expressServer = new ExpressServer({
      ui: this.ui,
      project: this.project,
      watcher: watcher
    });

    var liveReloadServer = new LiveReloadServer({
      ui: this.ui,
      analytics: this.analytics,
      watcher: watcher
    });

    if (options.expressServer) {
      return Promise.all([
          liveReloadServer.start(expressServerOptions),
          expressServer.start(expressServerOptions)
        ]).then(function() {
          return new Promise(function() {
            this.invokeTestem(testemOptions);
          });
        });
    } else {
      return this.invokeTestem(testemOptions);
    }
  }
});
