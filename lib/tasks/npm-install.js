'use strict';

// Runs `npm install` in cwd
var path = require('path');
var existsSync = require('exists-sync');
var NpmTask = require('./npm-task');
var formatPackageList = require('../utilities/format-package-list');

module.exports = NpmTask.extend({
  command: 'install',

  run() {
    var ui = this.ui;
    var packageJson = path.join(this.project.root, 'package.json');

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
