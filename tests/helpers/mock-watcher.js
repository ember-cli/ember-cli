'use strict';

let RSVP = require('rsvp');
let EventEmitter = require('events').EventEmitter;
let path = require('path');

function MockWatcher() {
  EventEmitter.apply(this, arguments);
  this.tracks = [];
  this.trackTimings = [];
  this.trackErrors = [];
}

module.exports = MockWatcher;

MockWatcher.prototype = Object.create(EventEmitter.prototype);

MockWatcher.prototype.then = function() {
  let promise = RSVP.resolve({
    directory: path.resolve(__dirname, '../fixtures/express-server'),
  });
  return promise.then.apply(promise, arguments);
};
