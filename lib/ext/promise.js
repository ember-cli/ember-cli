'use strict';

var RSVP = require('rsvp');
var Promise = RSVP.Promise;

Promise.prototype.returns = function(value) {
  return this.then(function() {
    return value;
  });
};

Promise.prototype.invoke = function(method) {
  var args = Array.prototype.slice(arguments, 1);

  return this.then(function(value) {
    return value[method].apply(value, args);
  }, undefined, 'invoke: ' + method + ' with: ' + args);
};

Promise.prototype.map = function(mapFn) {
  return this.then(function(values) {
    return RSVP.map(values, mapFn);
  });
};

Promise.prototype.filter = function(mapFn) {
  return this.then(function(values) {
    return RSVP.filter(values, mapFn);
  });
};
