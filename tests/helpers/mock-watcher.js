'use strict';

var EventEmitter = require('events').EventEmitter;

function MockWatcher() {
  EventEmitter.apply(this, arguments);
  this.tracks = [];
  this.trackTimings = [];
  this.trackErrors = [];
}

module.exports = MockWatcher;

MockWatcher.prototype = Object.create(EventEmitter.prototype);

