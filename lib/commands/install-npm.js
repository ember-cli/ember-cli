'use strict';

var Command = require('../models/command');

module.exports = Command.extend({
  name: 'install:npm',
  description: 'Installs npm packages.',
  works: 'insideProject',

  anonymousOptions: [
    '<package-names...>'
  ],

  run: function(commandOptions, rawArgs) {
    var NpmInstallTask = this.tasks.NpmInstall;
    var npmInstall     = new NpmInstallTask({
      ui:         this.ui,
      analytics:  this.analytics,
      project:    this.project
    });

    return npmInstall.run({
      packages: rawArgs,
      'save-dev': true,
      'save-exact': true
    });
  }
});
