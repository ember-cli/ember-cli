'use strict';

var chalk   = require('chalk');
var Task    = require('./task');

module.exports = Task.extend({
  init: function() {
    var Watcher = require('broccoli/lib/watcher');
    this.watcher = this.watcher || new Watcher(this.builder, {
      verbose: true
    });

    this.watcher.on('error', this.didError.bind(this));
    this.watcher.on('change', this.didChange.bind(this));

    this._lastError = null;
  },

  didError: function(error) {
    this._lastError = error;

    this.analytics.trackError({
      description: error && error.message
    });
  },

  then: function() {
    return this.watcher.then.apply(this.watcher, arguments);
  },

  didChange: function(results) {
    var totalTime = results.totalTime;

    if (this._lastError) {
      this._lastError = null;
      this.ui.write(chalk.green('\n\nBuild successful.\n'));
    }

    this.analytics.track({
      name:    'ember rebuild',
      message: 'broccoli rebuild time: ' + totalTime + 'ms'
    });

    this.analytics.trackTiming({
      category: 'ember rebuild',
      variable: 'broccoli rebuild time',
      value: totalTime
    });
  },

  on: function() {
    this.watcher.on.apply(this.watcher, arguments);
  },

  off: function() {
    this.watcher.off.apply(this.watcher, arguments);
  }
});
