'use strict';

var chalk    = require('chalk');
var Task     = require('../models/task');
var Builder  = require('../models/builder');

module.exports = Task.extend({
  // Options: String outputPath
  run: function(options) {
    var ui        = this.ui;
    var analytics = this.analytics;

    ui.pleasantProgress.start(chalk.green('Building'), chalk.green('.'));

    var builder = new Builder({
      outputPath: options.outputPath,
      environment: options.environment
    });

    return builder.build()
      .then(function(results) {
        var totalTime = results.totalTime / 1e6;

        analytics.track({
          name:    'ember build',
          message: totalTime + 'ms'
        });

        analytics.trackTiming({
          category: 'rebuild',
          variable: 'build time',
          label:    'broccoli build time',
          value:    parseInt(totalTime, 10)
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

        if (err.message) {
          ui.write(err.message+'\n');
        }
        if (err.file) {
          var file = err.file;
          if (err.line) {
            file += err.col ? ' ('+err.line+':'+err.col+')' : ' ('+err.line+')';
          }
          ui.write('File: ' + file + '\n');
        }
        ui.write(err.stack);

        return 1;
      });
  }
});
