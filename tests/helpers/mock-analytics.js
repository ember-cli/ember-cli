'use strict';

module.exports = MockAnalytics;
function MockAnalytics() {
  this.track = function(){};
  this.trackTiming = function(){};
}

MockAnalytics.prototype = Object.create({});
MockAnalytics.prototype.constructor = MockAnalytics;
