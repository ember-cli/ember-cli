'use strict';

var Task    = require('../models/task');
var Promise = require('../ext/promise');
var rimraf  = Promise.denodeify(require('rimraf'));
var chalk   = require('chalk');

module.exports = Task.extend({
  init: function() {
    this.testem = this.testem || new (require('testem'))();
  },
  run: function(options) {
    var ui = this.ui;
    var testem = this.testem;

    // The building has actually started already, but we want some output while we wait for the server
    ui.pleasantProgress.start(chalk.green('Building'), chalk.green('.'));

    return new Promise(function() {
      var testemOptions = {
        file: options.configFile,
        port: options.port,
        cwd: options.outputPath
      };

      var watcher = options.watcher;
      var started = false;

      // Wait for a build and then either start or restart testem
      watcher.on('change', function() {
        if (started) {
          testem.restart();
        } else {
          started = true;

          ui.pleasantProgress.stop();

          testem.startDev(testemOptions, function(code) {
            rimraf(options.outputPath)
              .finally(function() {
                process.exit(code);
              });
          });
        }
      });
    });
  }
});
