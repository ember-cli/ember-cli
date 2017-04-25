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
    return `${this.useYarn ? 'Yarn' : 'NPM'}: Uninstalling ${formatPackageList(packages)} ...`;
  }

  formatCompleteMessage(packages) {
    return `${this.useYarn ? 'Yarn' : 'NPM'}: Uninstalled ${formatPackageList(packages)}`;
  }
}

module.exports = NpmUninstallTask;
