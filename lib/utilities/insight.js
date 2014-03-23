'use strict';

var Promise = require('rsvp').Promise;
var Insight = require('insight');

function InsightWrapper(options) {
  this.insight = options.insight || new Insight(options);
}

module.exports = InsightWrapper;

InsightWrapper.prototype.askPermission = function(message) {
  var _this = this;
  return new Promise(function(resolve) {
    _this.insight.askPermission(message, function(optOut) {
      resolve(optOut);
    });
  });
};

InsightWrapper.prototype.track = function() {
  return this.insight.track.apply(this.insight, arguments);
}
