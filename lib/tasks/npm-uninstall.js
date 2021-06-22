'use strict';

// Runs `npm uninstall` in cwd

const NpmTask = require('./npm-task');
const formatPackageList = require('../utilities/format-package-list');

class NpmUninstallTask extends NpmTask {
  constructor(options) {
    super(options);
    this.command = 'uninstall';
  }

  formatStartMessage(packages) {
    return `${this.packageManagerOutputName}: Uninstalling ${formatPackageList(packages)} ...`;
  }

  formatCompleteMessage(packages) {
    return `${this.packageManagerOutputName}: Uninstalled ${formatPackageList(packages)}`;
  }
}

module.exports = NpmUninstallTask;
