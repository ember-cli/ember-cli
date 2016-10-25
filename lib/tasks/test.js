'use strict';

var Task        = require('../models/task');
var Promise     = require('../ext/promise');
var SilentError = require('silent-error');

module.exports = Task.extend({
  init: function() {
    this._super.apply(this, arguments);
    this.testem = this.testem || new (require('testem'))();
  },

  invokeTestem: function (options) {
    var testem = this.testem;
    var task = this;

    return new Promise(function(resolve, reject) {
      testem.startCI(task.testemOptions(options), function(exitCode, error) {
        if (error) {
          reject(error);
        } else if (exitCode !== 0) {
          reject(new SilentError('Testem finished with non-zero exit code. Tests failed.'));
        } else {
          resolve(exitCode);
        }
      });
    });
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

  testemOptions: function(options) {
    var testemOptions = {
      host: options.host,
      port: options.port,
      cwd: options.outputPath,
      reporter: options.reporter,
      middleware: this.addonMiddlewares(),
      launch: options.launch,
      file: options.configFile,
      /* eslint-disable camelcase */
      config_dir: process.cwd(),
      test_page: options.testPage,
      query_params: options.queryString
      /* eslint-enable camelcase */
    };

    return testemOptions;
  },

  run: function(options) {
    return this.invokeTestem(options);
  }
});
