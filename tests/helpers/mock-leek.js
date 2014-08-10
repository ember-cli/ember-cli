'use strict';

function MockLeek() {}

MockLeek.prototype.track = function() {};
MockLeek.prototype.trackEvent = function() {};
MockLeek.prototype.trackError = function() {};

module.exports = MockLeek;

