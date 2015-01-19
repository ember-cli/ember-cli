'use strict';

var Task        = require('../models/task');
var Promise     = require('../ext/promise');
var SilentError = require('../errors/silent');

module.exports = Task.extend({
  init: function() {
    this.testem = this.testem || new (require('testem'))();
  },
  invokeTestem: function (options) {
    var testem = this.testem;

    return new Promise(function(resolve, reject) {
      testem.startCI(this.testemOptions(options), function(exitCode) {
        if (!testem.app.reporter.total) {
          reject(new SilentError('No tests were run, please check whether any errors occurred in the page (ember test --server) and ensure that you have a test launcher (e.g. PhantomJS) enabled.'));
        }

        resolve(exitCode);
      });
    }.bind(this));
  },

  addonMiddlewares: function(options) {
    this.project.initializeAddons();
    var middlewares = [];
    this.project.addons.forEach(function(addon){
      if (addon.testemMiddleware) {
        // middleware might not be enabled, therefore not be returned
        var middleware = addon.testemMiddleware({
          options: options
        });
        // test that a middleware was returned before pushing it into middlewares array
        if (middleware) {
          middlewares.push(middleware);
        }
      }
    });
    return middlewares;
  },

  testemOptions: function(options) {
    return {
      file: options.configFile,
      port: options.port,
      cwd: options.outputPath,
      middleware: this.addonMiddlewares(options)
    };
  },

  run: function(options) {
    return this.invokeTestem(options);
  }
});
