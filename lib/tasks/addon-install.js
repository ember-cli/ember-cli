'use strict';

var Task        = require('../models/task');
var SilentError = require('../errors/silent');
var merge       = require('lodash/object/merge');

module.exports = Task.extend({
  init: function() {
    this.NpmInstallTask = this.NpmInstallTask || require('./npm-install');
    this.BlueprintTask = this.BlueprintTask || require('./generate-from-blueprint');
  },

  run: function(options) {
    var chalk            = require('chalk');
    var ui               = this.ui;
    var packageName      = options['package'];
    var extraArgs        = options.extraArgs || [];
    var blueprintOptions = options.blueprintOptions || {};
    
    var npmInstall = new this.NpmInstallTask({
      ui:         this.ui,
      analytics:  this.analytics,
      project:    this.project
    });

    var blueprintInstall = new this.BlueprintTask({
      ui:         this.ui,
      analytics:  this.analytics,
      project:    this.project,
      testing:    this.testing
    });

    ui.startProgress(chalk.green('Installing addon package'), chalk.green('.'));

    return npmInstall.run({
      packages: [packageName],
      'save-dev': true,
      'save-exact': true
    }).then(function() {
      return this.project.reloadAddons();
    }.bind(this)).then(function() {
      return this.installBlueprint(blueprintInstall, packageName, extraArgs,
                                   blueprintOptions);
    }.bind(this))
    .finally(function() { ui.stopProgress(); })
    .then(function() {
      ui.writeLine(chalk.green('Installed addon package.'));
    });
  },

  installBlueprint: function(install, packageName, extraArgs, blueprintOptions) {
    var blueprintName = this.findDefaultBlueprintName(packageName);

    var taskOptions = merge({
      args: [blueprintName].concat(extraArgs),
      ignoreMissingMain: true
    }, blueprintOptions || {});

    return install.run(taskOptions);
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
