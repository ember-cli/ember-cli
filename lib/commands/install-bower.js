'use strict';

var Command = require('../models/command');

module.exports = Command.extend({
  name: 'install:bower',
  description: 'Installs bower packages.',
  works: 'insideProject',

  anonymousOptions: [
    '<package-names...>'
  ],

  run: function(commandOptions, rawArgs) {
    var BowerInstallTask = this.tasks.BowerInstall;
    var bowerInstall     = new BowerInstallTask({
      ui:         this.ui,
      analytics:  this.analytics,
      project:    this.project
    });

    return bowerInstall.run({
      packages: rawArgs,
      installOptions: { save: true }
    });
  }
});
