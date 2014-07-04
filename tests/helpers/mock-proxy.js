'use strict';

var MockProxy = function() {
  this.called = false;
  this.lastReq = null;
};
module.exports = MockProxy;

MockProxy.prototype.handler = function(req, res) {
  this.called = true;
  this.lastReq = req;
  res.end();
};
