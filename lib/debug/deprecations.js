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
  EMBROIDER: deprecation({
    for: 'ember-cli',
    id: 'ember-cli.dont-use-embroider-option',
    since: {
      available: '6.8.0',
    },
    until: '7.0.0',
    url: 'https://deprecations.emberjs.com/id/dont-use-embroider-option',
  }),

  INIT_TARGET_FILES: deprecation({
    for: 'ember-cli',
    id: 'ember-cli.init-target-files',
    since: {
      available: '6.8.0',
    },
    until: '7.0.0',
    url: 'https://deprecations.emberjs.com/id/init-no-file-names',
  }),
};

module.exports = DEPRECATIONS;
