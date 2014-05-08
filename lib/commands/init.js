'use strict';

var path      = require('path');
var Command   = require('../models/command');
var Promise   = require('../ext/promise');
var Blueprint = require('../blueprint');

var validProjectName = require('../utilities/valid-project-name');

module.exports = Command.extend({
  description: 'Creates a new ember-cli project in the current folder.',
  works: 'everywhere',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false },
    { name: 'verbose', type: Boolean, default: false },
    { name: 'blueprint', type: path, default: Blueprint.main }
  ],

  name: 'init',
  aliases: ['i'],

  run: function(commandOptions/*, rawArgs */) {

    var installBlueprint = new this.tasks.InstallBlueprint({
      ui: this.ui
    });
    var npmInstall       = new this.tasks.NpmInstall({
      ui: this.ui
    });
    var bowerInstall     = new this.tasks.BowerInstall({
      ui: this.ui
    });

    var project          = this.project;
    var packageName      = project.name();
    var blueprintOpts    = {
      dryRun: commandOptions.dryRun,
      blueprint: commandOptions.blueprint,
      rawName: packageName
    };

    if (!validProjectName(packageName)) {
      this.ui.write('We currently do not support an application name of `' + packageName + '`.');
      return Promise.reject();
    }

    return installBlueprint.run(blueprintOpts)
      .then(function() {
        if (!commandOptions.dryRun) {
          return npmInstall.run({ verbose: commandOptions.verbose });
        }
      })
      .then(function() {
        if (!commandOptions.dryRun) {
          return bowerInstall.run({ verbose: commandOptions.verbose });
        }
      });
  },

  usageInstructions: function() {
    return {
      anonymousOptions: '<app-name>'
    };
  }
});
