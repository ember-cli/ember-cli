'use strict';

module.exports = MockAnalytics;
function MockAnalytics() {
  this.tracks = [];
  this.trackTimings = [];
  this.trackErrors = [];
  this.name = '';
}

MockAnalytics.prototype = Object.create({});
MockAnalytics.prototype.track = function track(arg) {
  this.tracks.push(arg);
};

MockAnalytics.prototype.trackTiming = function trackTiming(arg) {
  this.trackTimings.push(arg);
};

MockAnalytics.prototype.trackError = function trackError(arg) {
  this.trackErrors.push(arg);
};

MockAnalytics.prototype.setName = function setName(arg) {
  this.name = arg;
};

MockAnalytics.prototype.constructor = MockAnalytics;
