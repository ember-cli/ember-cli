'use strict';

var chalk        = require('chalk');
var Command      = require('../models/command');
var Promise      = require('../ext/promise');
var path         = require('path');
var Blueprint    = require('../blueprint');
var NULL_PROJECT = require('../models/project').NULL_PROJECT;

var validProjectName = require('../utilities/valid-project-name');

module.exports = Command.extend({
  description: 'Creates a new folder and runs ' + chalk.green('ember init') + ' in it.',

  name: 'new',
  works: 'outsideProject',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false },
    { name: 'init', type: Boolean, default: false },
    { name: 'verbose', type: Boolean, default: false },
    { name: 'blueprint', type: path, default: Blueprint.main }
  ],

  run: function(commandOptions, rawArgs) {
    var packageName = rawArgs[0];

    if (!packageName) {
      this.ui.write(chalk.yellow('The `ember new` command requires an ' +
               'app-name to be specified. For more details, use `ember help`.\n'));

      return Promise.reject();
    }


    if (!validProjectName(packageName)) {
      this.ui.write('We currently do not support an application name of `' + packageName + '`.');
      return Promise.reject();
    }

    var createAndStepIntoDirectory  = new this.tasks.CreateAndStepIntoDirectory({
      ui: this.ui,
      analytics: this.analytics
    });
    var InitCommand = this.commands.Init;

    var initCommand = new InitCommand({
      ui: this.ui,
      analytics: this.analytics,
      tasks: this.tasks,
      project: NULL_PROJECT,
      cmdName: this.cmdName,
      cmdArgs: this.cmdArgs
    });

    return createAndStepIntoDirectory
      .run({
        directoryName: packageName,
        commandOptions: commandOptions
      })
      .then(initCommand.run.bind(initCommand, commandOptions, rawArgs));
  },

  usageInstructions: function() {
    return {
      anonymousOptions: '<app-name>'
    };
  }
});
