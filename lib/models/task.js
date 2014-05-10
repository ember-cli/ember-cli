'use strict';

function Task(options) {
  this.ui        = options.ui;
  this.analytics = options.analytics;
  this.project   = options.project;
}

module.exports = Task;

Task.__proto__ = require('./core-object');

Task.prototype.run = function(/*options*/) {
  throw new Error('Task needs to have run() defined.');
};
