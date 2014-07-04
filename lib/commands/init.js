'use strict';

var path      = require('path');
var Command   = require('../models/command');
var Promise   = require('../ext/promise');

var validProjectName = require('../utilities/valid-project-name');

module.exports = Command.extend({
  name: 'init',
  aliases: ['i'],
  description: 'Creates a new ember-cli project in the current folder.',
  works: 'everywhere',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false },
    { name: 'verbose', type: Boolean, default: false },
    { name: 'blueprint', type: path, default: 'app' },
    { name: 'skip-npm', type: Boolean, default: false },
    { name: 'skip-bower', type: Boolean, default: false }
  ],

  anonymousOptions: [
    '<app-name>'
  ],

  run: function(commandOptions, rawArgs) {
    if (commandOptions.dryRun) {
      commandOptions.skipNpm = true;
      commandOptions.skipBower = true;
    }

    var installBlueprint = new this.tasks.InstallBlueprint({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });

    var npmInstall = new this.tasks.NpmInstall({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });

    var bowerInstall = new this.tasks.BowerInstall({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });

    var project          = this.project;
    var packageName      = rawArgs[0] !== '.' && rawArgs[0] || project.name();
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
        if (!commandOptions.skipNpm) {
          return npmInstall.run({
              verbose: commandOptions.verbose
            });
        }
      })
      .then(function() {
        if (!commandOptions.skipBower) {
          return bowerInstall.run({
              verbose: commandOptions.verbose
            });
        }
      });
  }
});
