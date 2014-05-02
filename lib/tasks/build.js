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
    var start   = new Date();

    return builder.build()
      .then(function(broccoliDir) {
        analytics.track({
          name:    'ember build',
          message: 'broccoli rebuild time: ' + (Date.now() - start) + 'ms'
        });

        analytics.trackTiming({
          category: 'ember build',
          variable: 'broccoli rebuild time',
          value:    (Date.now() - start) + 'ms'
        });

        return rimraf(options.outputPath)
          .then(function() {
            return mkdir(options.outputPath);
          })
          .then(function() {
            return ncp(broccoliDir, options.outputPath, {
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
