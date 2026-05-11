'use strict';

const emberCLIVersionPackageVersion = require('../../package').version;
const { makeDeprecate, isDeprecationRemoved } = require('semver-deprecate');

const emberCLIVersion = process.env.OVERRIDE_DEPRECATION_VERSION ?? emberCLIVersionPackageVersion;

const deprecate = makeDeprecate('ember-cli', emberCLIVersion);

/**
 * This function deferrs to the upstream {@link isDeprecationRemoved} function from semver-deprecate
 * but closes around the current emberCLIVersion for convenience since there is some logic around
 * what is considered the current version
 *
 * @private
 * @method
 * @param {string} until - a Semver formatted version when the deprecation will be removed
 * @return {boolean}
 */
function _isDeprecationRemoved(until) {
  return isDeprecationRemoved(until, emberCLIVersion);
}

module.exports = deprecate;
module.exports._isDeprecationRemoved = _isDeprecationRemoved;
