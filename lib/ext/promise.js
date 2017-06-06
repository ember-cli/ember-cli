'use strict';

const RSVP = require('rsvp');
const Promise = RSVP.Promise;

const deprecate = require('../utilities/deprecate');

function PromiseExt(resolver, label) {
  this._superConstructor(resolver, label);
}

// Utility functions on the native CTOR need some massaging
PromiseExt.hash = function() {
  return this.resolve(RSVP.hash.apply(null, arguments));
};

PromiseExt.denodeify = function() {
  let fn = RSVP.denodeify.apply(null, arguments);
  let Constructor = this;
  let newFn = function() {
    return Constructor.resolve(fn.apply(null, arguments));
  };
  newFn.__proto__ = arguments[0];
  return newFn;
};

PromiseExt.filter = function() {
  return this.resolve(RSVP.filter.apply(null, arguments));
};

PromiseExt.map = function() {
  return this.resolve(RSVP.map.apply(null, arguments));
};

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

Object.defineProperty(module, 'exports', {
  get() {
    // Get the call stack so we can let the user know what module is using the deprecated function.
    let stack = new Error().stack;
    stack = stack.split('\n')[5];
    stack = stack.replace('    at ', '  ');

    deprecate(`\`ember-cli/ext/promise\` is deprecated, use \`rsvp\` instead. Required here: \n${stack.toString()}`, true);
    return PromiseExt;
  },
});
