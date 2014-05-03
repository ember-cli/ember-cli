'use strict';

var Promise  = require('../ext/promise');
var rimraf   = Promise.denodeify(require('rimraf'));
var mkdir    = Promise.denodeify(require('fs').mkdir);
var ncp      = Promise.denodeify(require('ncp'));
var chalk    = require('chalk');
var Task     = require('../models/task');
var buildBuilder = require('../utilities/build-builder');

module.exports = Task.extend({
  // Options: String outputPath
  run: function(options) {
    var ui        = this.ui;
    var analytics = this.analytics;

    ui.pleasantProgress.start(chalk.green('Building'), chalk.green('.'));

    process.env.EMBER_ENV = options.environment || 'development';

    var builder = buildBuilder();

    return builder.build()
      .then(function(results) {
        var totalTime = results.totalTime / 1e6;
        analytics.track({
          name:    'ember build',
          message: 'broccoli build time: ' + totalTime + 'ms'
        });

        analytics.trackTiming({
          category: 'ember build',
          variable: 'broccoli build time',
          value:    totalTime + 'ms'
        });

        return rimraf(options.outputPath)
          .then(function() {
            return mkdir(options.outputPath);
          })
          .then(function() {
            return ncp(results.directory, options.outputPath, {
                clobber: true,
                stopOnErr: true
              });
          });
      })
      .finally(function() {
        ui.pleasantProgress.stop();
      })
      .then(function() {
        ui.write(chalk.green('Built project successfully. Stored in "' +
          options.outputPath + '".\n'));
      })
      .catch(function(err) {
        ui.write(chalk.red('Build failed.\n'));

        if (err.file) {
          ui.write('File: ' + err.file + '\n');
        }
        ui.write(err.stack);
      })
      .finally(function() {
        builder.cleanup();
      });
  }
});
