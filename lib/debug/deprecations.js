'use strict';

const { _isDeprecationRemoved } = require('./deprecate');

function deprecation(options) {
  return {
    options,
    isRemoved: _isDeprecationRemoved(options.until),
  };
}

const DEPRECATIONS = {
  DEPRECATE_OUTPUT_PATHS: deprecation({
    for: 'ember-cli',
    id: 'ember-cli.outputPaths-build-option',
    since: {
      available: '5.3.0',
      enabled: '5.3.0',
    },
    until: '6.0.0',
  }),
  DEPRECATE_TRAVIS_CI_SUPPORT: deprecation({
    for: 'ember-cli',
    id: 'travis-ci-support',
    since: {
      available: '5.5.0',
      enabled: '5.5.0',
    },
    until: '6.0.0',
    url: 'https://deprecations.emberjs.com/id/travis-ci-support',
  }),
  V1_ADDON_CONTENT_FOR_TYPES: deprecation({
    for: 'ember-cli',
    id: 'ember-cli.v1-addon-content-for-types',
    since: {
      available: '6.2.0',
    },
    until: '7.0.0',
    url: 'https://deprecations.emberjs.com/id/v1-addon-content-for-types',
    meta: {
      types: ['app-prefix', 'app-suffix', 'tests-prefix', 'tests-suffix', 'vendor-prefix', 'vendor-suffix'],
    },
  }),
};

module.exports = DEPRECATIONS;
