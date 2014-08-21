'use strict';

var chalk        = require('chalk');
var Command      = require('../models/command');
var Promise      = require('../ext/promise');
var path         = require('path');
var NULL_PROJECT = require('../models/project').NULL_PROJECT;

var SilentError      = require('../errors/silent');
var validProjectName = require('../utilities/valid-project-name');

module.exports = Command.extend({
  name: 'new',
  description: 'Creates a new folder and runs ' + chalk.green('ember init') + ' in it.',
  works: 'outsideProject',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false },
    { name: 'verbose', type: Boolean, default: false },
    { name: 'blueprint', type: path, default: 'app' },
    { name: 'skip-npm', type: Boolean, default: false },
    { name: 'skip-bower', type: Boolean, default: false },
    { name: 'skip-git', type: Boolean, default: false },
  ],

  anonymousOptions: [
    '<app-name>'
  ],

  run: function(commandOptions, rawArgs) {
    var packageName = rawArgs[0],
        message;

    if (!packageName) {
      message = chalk.yellow('The `ember ' + this.name + '` command requires a ' +
                             'name to be specified. For more details, use `ember help`.');

      return Promise.reject(new SilentError(message));
    }

    if (commandOptions.dryRun){
      commandOptions.skipGit = true;
    }

    if (!validProjectName(packageName)) {
      message = 'We currently do not support a name of `' + packageName + '`.';

      return Promise.reject(new SilentError(message));
    }

    var createAndStepIntoDirectory  = new this.tasks.CreateAndStepIntoDirectory({
      ui: this.ui,
      analytics: this.analytics
    });
    var InitCommand = this.commands.Init;

    var gitInit = new this.tasks.GitInit({
      ui: this.ui,
      project: this.project
    });

    var initCommand = new InitCommand({
      ui: this.ui,
      analytics: this.analytics,
      tasks: this.tasks,
      project: NULL_PROJECT
    });

    return createAndStepIntoDirectory
      .run({
        directoryName: packageName,
        dryRun: commandOptions.dryRun
      })
      .then(initCommand.run.bind(initCommand, commandOptions, rawArgs))
      .then(gitInit.run.bind(gitInit, commandOptions, rawArgs));
  },
});
