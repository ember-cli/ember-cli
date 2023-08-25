'use strict';

const path = require('path');
const fs = require('fs');
const NpmTask = require('./npm-task');
const formatPackageList = require('../utilities/format-package-list');

class NpmInstallTask extends NpmTask {
  constructor(options) {
    super(options);
    this.command = 'install';
  }

  run(options) {
    let ui = this.ui;
    let packageJson = path.join(this.project.root, 'package.json');

    if (!fs.existsSync(packageJson)) {
      ui.writeWarnLine('Skipping install: `package.json` not found.');
      return Promise.resolve();
    } else {
      return super.run(options);
    }
  }

  formatStartMessage(packages) {
    return `${this.packageManagerOutputName}: Installing ${formatPackageList(packages)} ...`;
  }

  formatCompleteMessage(packages) {
    return `${this.packageManagerOutputName}: Installed ${formatPackageList(packages)}`;
  }
}

module.exports = NpmInstallTask;
