'use strict';

const { _isDeprecationRemoved } = require('./deprecate');

// eslint-disable-next-line no-unused-vars
function deprecation(options) {
  return {
    options,
    isRemoved: _isDeprecationRemoved(options.until),
  };
}

const DEPRECATIONS = {
  V1_ADDON_CONTENT_FOR_TYPES: deprecation({
    for: 'ember-cli',
    id: 'ember-cli.v1-addon-content-for-types',
    since: {
      available: '6.3.0',
    },
    until: '7.0.0',
    url: 'https://deprecations.emberjs.com/id/v1-addon-content-for-types',
    meta: {
      types: ['app-prefix', 'app-suffix', 'tests-prefix', 'tests-suffix', 'vendor-prefix', 'vendor-suffix'],
    },
  }),
};

module.exports = DEPRECATIONS;
