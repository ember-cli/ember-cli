'use strict';

let versionUtils = require('../lib/utilities/version-utils');
let emberCLIVersion = versionUtils.emberCLIVersion;

module.exports = function(data, options) {
  options.project.version = emberCLIVersion();
};
