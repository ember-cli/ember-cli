'use strict';

var versionUtils = require('../lib/utilities/version-utils');
var emberCLIVersion = versionUtils.emberCLIVersion;

module.exports = function(data, options) {
  options.project.version = emberCLIVersion();
};
