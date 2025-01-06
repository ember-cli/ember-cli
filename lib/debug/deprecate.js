'use strict';

const emberCLIVersion = require('../../package').version;
const { makeDeprecate } = require('semver-deprecate');

const deprecate = makeDeprecate('ember-cli', emberCLIVersion);

function isDeprecationRemoved(until) {
  const currentEmberCLIVersion = parseFloat(process.env.OVERRIDE_DEPRECATION_VERSION ?? emberCLIVersion);

  let significantUntil = until.replace(/(\.0+)/g, '');
  return currentEmberCLIVersion >= parseFloat(significantUntil);
}

module.exports = deprecate;
module.exports._isDeprecationRemoved = isDeprecationRemoved;
