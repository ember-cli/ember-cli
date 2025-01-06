'use strict';

const emberCLIVersion = require('../../package').version;
const { makeDeprecate } = require('semver-deprecate');

const deprecate = makeDeprecate('ember-cli', emberCLIVersion);

module.exports = deprecate;
