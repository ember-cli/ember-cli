'use strict';

var Task = require('../models/task');
var Promise = require('../ext/promise');
var SilentError = require('silent-error');

module.exports = Task.extend({
  init() {
    this._super.apply(this, arguments);
    this.testem = this.testem || new (require('testem'))();
  },

  invokeTestem(options) {
    var testem = this.testem;
    var task = this;

    return new Promise((resolve, reject) => {
      testem.startCI(task.testemOptions(options), (exitCode, error) => {
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

  addonMiddlewares() {
    this.project.initializeAddons();

    return this.project.addons.reduce((addons, addon) => {
      if (addon.testemMiddleware) {
        addons.push(addon.testemMiddleware.bind(addon));
      }

      return addons;
    }, []);
  },

  testemOptions(options) {
    return {
      host: options.host,
      port: options.port,
      cwd: options.outputPath,
      debug: options.testemDebug,
      reporter: options.reporter,
      middleware: this.addonMiddlewares(),
      launch: options.launch,
      file: options.configFile,
      /* eslint-disable camelcase */
      config_dir: process.cwd(),
      test_page: options.testPage,
      query_params: options.queryString,
      /* eslint-enable camelcase */
    };
  },

  run(options) {
    return this.invokeTestem(options);
  },
});
