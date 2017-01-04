'use strict';

// Runs `npm install` in cwd
const path = require('path');
const existsSync = require('exists-sync');
const NpmTask = require('./npm-task');
const formatPackageList = require('../utilities/format-package-list');

module.exports = NpmTask.extend({
  command: 'install',

  run() {
    let ui = this.ui;
    let packageJson = path.join(this.project.root, 'package.json');

    if (!existsSync(packageJson)) {
      ui.writeWarnLine('Skipping npm install: package.json not found');
      return;
    } else {
      return this._super.run.apply(this, arguments);
    }
  },

  formatStartMessage(packages) {
    return `NPM: Installing ${formatPackageList(packages)} ...`;
  },

  formatCompleteMessage(packages) {
    return `NPM: Installed ${formatPackageList(packages)}`;
  },
});
