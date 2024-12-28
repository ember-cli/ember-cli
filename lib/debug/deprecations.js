'use strict';

const { _isDeprecationRemoved } = require('./deprecate');

// eslint-disable-next-line no-unused-vars
function deprecation(options) {
  return {
    options,
    isRemoved: _isDeprecationRemoved(options.until),
  };
}

const DEPRECATIONS = {};

module.exports = DEPRECATIONS;
