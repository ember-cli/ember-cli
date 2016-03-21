'use strict';

var Command       = require('../models/command');
var lookupCommand = require('../cli/lookup-command');
var SilentError   = require('silent-error');
var Promise       = require('../ext/promise');

module.exports = Command.extend({
  name: 'install',
  description: 'Installs an ember-cli addon from npm.',
  aliases: ['i'],
  works: 'insideProject',

  anonymousOptions: [
    '<addon-name>'
  ],

  run: function(commandOptions, addonNames) {
    if (!addonNames.length) {
      var msg  = 'The `install` command must take an argument with the name';
      msg     += ' of an ember-cli addon. For installing all npm and bower ';
      msg     += 'dependencies you can run `npm install && bower install`.';
      return Promise.reject(new SilentError(msg));
    }

    var AddonInstallTask = this.tasks.AddonInstall;
    var addonInstall = new AddonInstallTask({
      ui:             this.ui,
      analytics:      this.analytics,
      project:        this.project,
      NpmInstallTask: this.tasks.NpmInstall,
      BlueprintTask:  this.tasks.GenerateFromBlueprint
    });

    var UpdateCommand = lookupCommand(this.commands, 'update-package-cache');
    var updatePackageCache = new UpdateCommand({
      ui:             this.ui,
      project:        this.project,
      commands:       this.commands,
      tasks:          this.tasks
    });

    return addonInstall.run({
      'packages': addonNames,
      blueprintOptions: commandOptions
    }).then(function() {
      updatePackageCache.run();
    });
  }
});
