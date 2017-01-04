'use strict';

// Runs `npm install` in cwd
let path = require('path');
let existsSync = require('exists-sync');
let NpmTask = require('./npm-task');
let formatPackageList = require('../utilities/format-package-list');

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
