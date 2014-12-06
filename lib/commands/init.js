'use strict';

var path      = require('path');
var Command   = require('../models/command');
var Promise   = require('../ext/promise');

var SilentError      = require('../errors/silent');
var validProjectName = require('../utilities/valid-project-name');

module.exports = Command.extend({
  name: 'init',
  aliases: ['i'],
  description: 'Creates a new ember-cli project in the current folder.',
  works: 'everywhere',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false, aliases: ['d'] },
    { name: 'verbose', type: Boolean, default: false, aliases: ['v'] },
    { name: 'blueprint', type: path, aliases: ['b'] },
    { name: 'skip-npm', type: Boolean, default: false, aliases: ['sn'] },
    { name: 'skip-bower', type: Boolean, default: false, aliases: ['sb'] },
    { name: 'name', type: String, default: '', aliases: ['n'] }
  ],

  anonymousOptions: [
    '<glob-pattern>'
  ],

  _defaultBlueprint: function() {
    if (this.project.isEmberCLIAddon()) {
      return 'addon';
    } else {
      return 'app';
    }
  },

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
    var packageName      = commandOptions.name !== '.' && commandOptions.name || project.name();
    var blueprintOpts    = {
      dryRun: commandOptions.dryRun,
      blueprint: commandOptions.blueprint || this._defaultBlueprint(),
      rawName: packageName,
      targetFiles: rawArgs || '',
      rawArgs: rawArgs.toString()
    };

    if (!validProjectName(packageName)) {
      return Promise.reject(new SilentError('We currently do not support a name of `' + packageName + '`.'));
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
