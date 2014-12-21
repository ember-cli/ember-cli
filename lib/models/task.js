'use strict';

var CoreObject = require('core-object');

function Task() {
  CoreObject.apply(this, arguments);
}

module.exports = Task;

Task.__proto__ = CoreObject;

Task.prototype._trackTiming = function(commandOptions, meta) {
  if (commandOptions && !commandOptions.disableAnalytics) {
    this.analytics.trackTiming(meta);
  }
};

Task.prototype._trackError = function(commandOptions, meta) {
  if (commandOptions && !commandOptions.disableAnalytics) {
    this.analytics.trackError(meta);
  }
};

Task.prototype._track = function(commandOptions, meta) {
  if (commandOptions && !commandOptions.disableAnalytics) {
    this.analytics.track(meta);
  }
};

Task.prototype.run = function(/*options*/) {
  throw new Error('Task needs to have run() defined.');
};
