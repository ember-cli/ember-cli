'use strict';

var chalk    = require('chalk');
var Task     = require('../models/task');
var Builder  = require('../models/builder');
var Watcher  = require('../models/watcher');

module.exports = Task.extend({
  // Options:
  // String outputPath
  // Boolean watch
  run: function(options) {
    this.options = options;
    var promise  = this.build(options);

    if (options.watch) {
      promise = promise.then(function() {
        this.watch(options);
      }.bind(this));
    }

    return promise;
  },

  build: function(options) {
    var env = options.environment || 'development';
    process.env.EMBER_ENV = process.env.EMBER_ENV || env;

    var ui        = this.ui;
    var analytics = this.analytics;

    ui.pleasantProgress.start(chalk.green('Building'), chalk.green('.'));

    this.builder = new Builder({
      outputPath: options.outputPath
    });

    return this.builder.build()
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
      });
  },

  watch: function(options) {
    var watcher = this.watcherFor(options);

    watcher.on('change', this.didChange.bind(this));
    watcher.on('error', this.didError.bind(this));
  },

  watcherFor: function(options) {
    return new Watcher({
      ui: this.ui,
      builder: this.builder,
      analytics: this.analytics,
      options: options
    });
  },

  didChange: function() {
    this.build(this.options);
  },

  didError: function(error) {
    this.ui.write(chalk.red(error.message) + '\n');
  },

});
