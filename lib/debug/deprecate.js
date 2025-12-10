'use strict';

const emberCLIVersionPackageVersion = require('../../package').version;
const { makeDeprecate } = require('semver-deprecate');

const emberCLIVersion = process.env.OVERRIDE_DEPRECATION_VERSION ?? emberCLIVersionPackageVersion;

const deprecate = makeDeprecate('ember-cli', emberCLIVersion);

function isDeprecationRemoved(until) {
  const currentEmberCLIVersion = parseFloat(emberCLIVersion);

  let significantUntil = until.replace(/(\.0+)/g, '');
  return currentEmberCLIVersion >= parseFloat(significantUntil);
}

module.exports = deprecate;
module.exports._isDeprecationRemoved = isDeprecationRemoved;
