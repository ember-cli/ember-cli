'use strict';

const RSVP = require('rsvp');
let Promise = RSVP.Promise;

module.exports = PromiseExt;

// Utility functions on the native CTOR need some massaging
module.exports.hash = function() {
  return this.resolve(RSVP.hash.apply(null, arguments));
};

module.exports.denodeify = function() {
  let fn = RSVP.denodeify.apply(null, arguments);
  let Constructor = this;
  let newFn = function() {
    return Constructor.resolve(fn.apply(null, arguments));
  };
  newFn.__proto__ = arguments[0];
  return newFn;
};

module.exports.filter = function() {
  return this.resolve(RSVP.filter.apply(null, arguments));
};

module.exports.map = function() {
  return this.resolve(RSVP.map.apply(null, arguments));
};

function PromiseExt(resolver, label) {
  this._superConstructor(resolver, label);
}

PromiseExt.prototype = Object.create(Promise.prototype);
PromiseExt.prototype.constructor = PromiseExt;
PromiseExt.prototype._superConstructor = Promise;
PromiseExt.__proto__ = Promise;

PromiseExt.prototype.returns = function(value) {
  return this.then(() => value);
};

PromiseExt.prototype.invoke = function(method) {
  let args = Array.prototype.slice(arguments, 1);

  return this.then(value => value[method].apply(value, args), undefined, `invoke: ${method} with: ${args}`);
};

function constructorMethod(promise, methodName, fn) {
  let Constructor = promise.constructor;

  return promise.then(values => Constructor[methodName](values, fn));
}

PromiseExt.prototype.map = function(mapFn) {
  return constructorMethod(this, 'map', mapFn);
};

PromiseExt.prototype.filter = function(filterFn) {
  return constructorMethod(this, 'filter', filterFn);
};
