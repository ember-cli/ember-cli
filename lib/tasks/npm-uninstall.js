'use strict';

// Runs `npm uninstall` in cwd

var NpmTask = require('./npm-task');
var formatPackageList = require('../utilities/format-package-list');

module.exports = NpmTask.extend({
  command: 'uninstall',

  formatStartMessage(packages) {
    return `NPM: Uninstalling ${formatPackageList(packages)} ...`;
  },

  formatCompleteMessage(packages) {
    return `NPM: Uninstalled ${formatPackageList(packages)}`;
  },
});
