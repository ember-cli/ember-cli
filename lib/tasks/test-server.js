'use strict';

var TestTask = require('./test');
var Promise  = require('../ext/promise');
var chalk    = require('chalk');
var SilentError = require('silent-error');

module.exports = TestTask.extend({
  invokeTestem: function(options) {
    var task = this;

    return new Promise(function(resolve, reject) {
      task.testem.startDev(task.testemOptions(options), function(exitCode, error) {
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

  run: function(options) {
    var ui = this.ui;
    var testem = this.testem;
    var task = this;

    // The building has actually started already, but we want some output while we wait for the server

    return new Promise(function(resolve, reject) {
      ui.startProgress(chalk.green('Building'), chalk.green('.'));

      var watcher = options.watcher;
      var started = false;

      // Wait for a build and then either start or restart testem
      watcher.on('change', function() {
        try {
          if (started) {
            testem.restart();
          } else {
            started = true;

            ui.stopProgress();
            resolve(task.invokeTestem(options));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
  }
});
