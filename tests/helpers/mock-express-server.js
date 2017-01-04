'use strict';

const RSVP = require('rsvp');
const EventEmitter = require('events').EventEmitter;
const path = require('path');

function MockExpressServer() {
  EventEmitter.apply(this, arguments);
  this.tracks = [];
  this.trackTimings = [];
  this.trackErrors = [];
}

module.exports = MockExpressServer;

MockExpressServer.prototype = Object.create(EventEmitter.prototype);

MockExpressServer.prototype.then = function() {
  let promise = RSVP.resolve({
    directory: path.resolve(__dirname, '../fixtures/express-server'),
  });
  return promise.then.apply(promise, arguments);
};
