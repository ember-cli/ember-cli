'use strict';

var BroccoliChange = require('../models/broccoli-change');

var Notifier = function() {
  this.subscribers = [];
};

Notifier.prototype.subscribe = function(subscriber) {
  this.subscribers.push(subscriber);
};

Notifier.prototype.triggerChange = function(dir) {
  var change = new BroccoliChange(dir);

  this.subscribers.forEach(function(subscriber) {
    subscriber(change);
  });
};

module.exports.installInto = function(broccoli) {
  var notifier = new Notifier();
  broccoli.subscribe = function(fn) {
    notifier.subscribe(fn);
  };

  broccoli.notify = function(dir) {
    notifier.triggerChange(dir);
  };
};
