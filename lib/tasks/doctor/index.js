'use strict';
var checkLibVersions  = require('./check-lib-versions');
var checkNPMOutdated = require('./check-npm-outdated');

module.exports = {
  checkNPMVersion: checkLibVersions,
  checkNPMOutdated: checkNPMOutdated
};