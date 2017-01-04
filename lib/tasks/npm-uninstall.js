'use strict';

// Runs `npm uninstall` in cwd

const NpmTask = require('./npm-task');
const formatPackageList = require('../utilities/format-package-list');

module.exports = NpmTask.extend({
  command: 'uninstall',

  formatStartMessage(packages) {
    return `NPM: Uninstalling ${formatPackageList(packages)} ...`;
  },

  formatCompleteMessage(packages) {
    return `NPM: Uninstalled ${formatPackageList(packages)}`;
  },
});
