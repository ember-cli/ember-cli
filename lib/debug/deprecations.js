'use strict';

const { _isDeprecationRemoved } = require('./deprecate');

function deprecation(options) {
  return {
    options,
    isRemoved: _isDeprecationRemoved(options.until),
  };
}

const DEPRECATIONS = {
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
};

module.exports = DEPRECATIONS;
