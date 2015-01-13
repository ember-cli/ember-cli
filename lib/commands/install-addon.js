'use strict';

var Command     = require('../models/command');

module.exports = Command.extend({
  name: 'install:addon',
  description: 'Installs an ember-cli addon from npm.',
  works: 'insideProject',

  anonymousOptions: [
    '<addon-name>'
  ],

  run: function(commandOptions, rawArgs) {
    var AddonInstallTask = this.tasks.AddonInstall;
    var addonInstall = new AddonInstallTask({
      ui:              this.ui,
      analytics:       this.analytics,
      project:         this.project,
      NpmInstallTask:  this.tasks.NpmInstall,
      BlueprintTask:   this.tasks.GenerateFromBlueprint
    });

    var packageName = rawArgs.slice(0,1)[0];
    var extraArgs   = rawArgs.slice(1);

    return addonInstall.run({
      'package':         packageName,
      extraArgs:         extraArgs,
      blueprintOptions:  commandOptions
    });
  }
});
