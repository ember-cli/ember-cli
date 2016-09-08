'use strict';

var SilentError = require('silent-error');
var deprecate   = require('../utilities/deprecate');

// Get the call stack so we can let the user know what module is using the deprecated function.
var stack = new Error().stack;

Object.defineProperty(module, 'exports', {
  get: function () {
    deprecate("`ember-cli/lib/errors/silent.js` is deprecated, use `silent-error` instead.  Module: \n" + stack.toString(), true);
    return SilentError;
  }
});
