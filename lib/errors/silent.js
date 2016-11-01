'use strict';

var SilentError = require('silent-error');
var deprecate   = require('../utilities/deprecate');

Object.defineProperty(module, 'exports', {
  get: function () {
    // Get the call stack so we can let the user know what module is using the deprecated function.
    var stack = new Error().stack;
    stack = stack.split('\n')[5];
    stack = stack.replace('    at ', '  ');

    deprecate('`ember-cli/lib/errors/silent.js` is deprecated, use `silent-error` instead. Required here: \n' + stack.toString(), true);
    return SilentError;
  }
});
