'use strict';

// Runs `npm install` in cwd
var path       = require('path');
var existsSync = require('exists-sync');
var NpmTask    = require('./npm-task');

module.exports = NpmTask.extend({
  command: 'install',
  startProgressMessage: 'Installing packages for tooling via npm',
  completionMessage: 'Installed packages for tooling via npm.',
  run: function() {
    var ui = this.ui;
    var packageJson = path.join(this.project.root, 'package.json');

    if (!existsSync(packageJson)) {
      ui.writeWarnLine('Skipping npm install: package.json not found');
      return;
    } else {
      return this._super.run.apply(this, arguments);
    }
  }
});
