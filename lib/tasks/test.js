'use strict';

var Task        = require('../models/task');
var Promise     = require('../ext/promise');
var SilentError = require('../errors/silent');
var ExpressServer    = require('./server/express-server');

module.exports = Task.extend({
  init: function() {
    this.testem = this.testem || new (require('testem'))();
  },
  invokeTestem: function (testemOptions) {
    var testem = this.testem;

    return new Promise(function(resolve, reject) {
      testem.startCI(testemOptions, function(exitCode) {
        if (!testem.app.reporter.total) {
          reject(new SilentError('No tests were run, please check whether any errors occurred in the page (ember test --server) and ensure that you have a test launcher (e.g. PhantomJS) enabled.'));
        }

        resolve(exitCode);
      });
    }.bind(this));
  },

  addonMiddlewares: function() {
    this.project.initializeAddons();

    return this.project.addons.reduce(function(addons, addon) {
      if (addon.testemMiddleware) {
        addons.push(addon.testemMiddleware.bind(addon));
      }

      return addons;
    }, []);
  },

  run: function(options) {
    var testemOptions = {
      file: options.configFile,
      port: options.port,
      cwd: options.outputPath,
      middleware: this.addonMiddlewares()
    };

    var expressServerOptions = {
      enabledInTest: this.project.config('test').mockApiEnabled || false,
      host: this.project.config('test').mockApiHost || '0.0.0.0',
      port: this.project.config('test').mockApiPort || 4200,
      baseURL: this.project.config('test').baseURL || '/',
      testRunnerPort: options.port
    };

    var expressServer = new ExpressServer({
      ui: this.ui,
      project: this.project
    });

    if (expressServerOptions.enabledInTest) {
      var self = this;
      return expressServer.start(expressServerOptions).then(function(){
        return self.invokeTestem(testemOptions);
      });
    } else {
      return this.invokeTestem(testemOptions);
    }
  }
});
