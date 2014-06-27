'use strict';

var chalk   = require('chalk');
var Task    = require('./task');

module.exports = Task.extend({
  verbose: true,

  init: function() {
    var Watcher = require('broccoli-sane-watcher');
    this.watcher = this.watcher || new Watcher(this.builder, {
      verbose: this.verbose,
      poll: this.polling()
    });

    this.watcher.on('error', this.didError.bind(this));
    this.watcher.on('change', this.didChange.bind(this));
  },

  didError: function(error) {
    this.analytics.trackError({
      description: error && error.message
    });
  },

  then: function() {
    return this.watcher.then.apply(this.watcher, arguments);
  },

  didChange: function(results) {
    var totalTime = results.totalTime / 1e6;

    this.ui.write(chalk.green('\nBuild successful - ' + Math.round(totalTime) + 'ms.\n'));

    this.analytics.track({
      name:    'ember rebuild',
      message: 'broccoli rebuild time: ' + totalTime + 'ms'
    });

    this.analytics.trackTiming({
      category: 'rebuild',
      variable: 'rebuild time',
      label:    'broccoli rebuild time',
      value:    parseInt(totalTime, 10)
    });
  },

  on: function() {
    this.watcher.on.apply(this.watcher, arguments);
  },

  off: function() {
    this.watcher.off.apply(this.watcher, arguments);
  },

  polling: function () {
    return this.options && this.options.watcher === 'polling';
  }
});
