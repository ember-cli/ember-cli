'use strict';

var Command     = require('../models/command');
var SilentError = require('../errors/silent');
var merge       = require('lodash-node/modern/objects/merge');

module.exports = Command.extend({
  name: 'install:addon',
  description: 'Installs an ember-cli addon from npm.',
  works: 'insideProject',

  anonymousOptions: [
    '<addon-name>'
  ],

  run: function(commandOptions, rawArgs) {
    var NpmInstallTask = this.tasks.NpmInstall;
    var npmInstall     = new NpmInstallTask({
      ui:         this.ui,
      analytics:  this.analytics,
      project:    this.project
    });

    var BlueprintTask    = this.tasks.GenerateFromBlueprint;
    var blueprintInstall = new BlueprintTask({
      ui:         this.ui,
      analytics:  this.analytics,
      project:    this.project,
      testing:    this.testing
    });

    return npmInstall.run({
      packages: rawArgs,
      'save-dev': true
    }).then(function() {
      return this.project.reloadAddons();
    }.bind(this)).then(function() {
      return this.installBlueprint(blueprintInstall, rawArgs, commandOptions);
    }.bind(this));
  },

  installBlueprint: function(install, rawArgs, commandOptions) {
    var args = this.addBlueprintNameToArgs(rawArgs);

    var taskOptions = merge({
      args: args,
      ignoreMissingMain: true
    }, commandOptions || {});

    return install.run(taskOptions);
  },

  addBlueprintNameToArgs: function(rawArgs) {
    var blueprintName = this.findDefaultBlueprintName(rawArgs[0]);

    return [blueprintName].concat(rawArgs.slice(1));
  },

  findDefaultBlueprintName: function(givenName) {
    var addon = this.project.findAddonByName(givenName);

    if (!addon) {
      throw new SilentError('Install failed. Could not find addon with name: ' + givenName);
    }

    var emberAddon = addon.pkg['ember-addon'];

    if (emberAddon && emberAddon.defaultBlueprint) {
      return emberAddon.defaultBlueprint;
    }

    return addon.pkg.name;
  }
});
