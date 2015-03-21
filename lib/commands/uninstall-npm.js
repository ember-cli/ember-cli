'use strict';

var Command = require('../models/command');

module.exports = Command.extend({
  name: 'uninstall:npm',
  description: 'Uninstalls npm packages.',
  works: 'insideProject',

  anonymousOptions: [
    '<package-names...>'
  ],

  run: function(commandOptions, rawArgs) {
    var NpmUninstallTask = this.tasks.NpmUninstall;
    var npmUninstall     = new NpmUninstallTask({
      ui:         this.ui,
      analytics:  this.analytics,
      project:    this.project
    });

    return npmUninstall.run({
      packages: rawArgs,
      'save-dev': true,
      'save-exact': true
    });
  }
});
