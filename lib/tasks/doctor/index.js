'use strict';
var checkLibVersions  = require('./check-lib-versions');
var checkNPMOutdated  = require('./check-npm-outdated');
var checkDependencies = require('./check-dependencies');

module.exports = {
  'check-npm-version': checkLibVersions,
  'check-npm-outdated': checkNPMOutdated,
  'check-dependencies': checkDependencies
};