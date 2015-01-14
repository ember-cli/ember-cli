'use strict';

var chalk        = require('chalk');
var path         = require('path');
var Command      = require('../models/command');
var Promise      = require('../ext/promise');
var NULL_PROJECT = require('../models/project').NULL_PROJECT;
var SilentError      = require('../errors/silent');
var validProjectName = require('../utilities/valid-project-name');

module.exports = Command.extend({
  name: 'new',
  description: 'Creates a new folder and runs ' + chalk.green('ember init') + ' in it.',
  works: 'outsideProject',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false, aliases: ['d'] },
    { name: 'verbose', type: Boolean, default: false, aliases: ['v'] },
    { name: 'blueprint', type: ['gitUrl', path], default: 'app', aliases: ['b'] },
    { name: 'skip-npm', type: Boolean, default: false, aliases: ['sn'] },
    { name: 'skip-bower', type: Boolean, default: false, aliases: ['sb'] },
    { name: 'skip-git', type: Boolean, default: false, aliases: ['sg'] },
  ],

  anonymousOptions: [
    '<app-name>'
  ],

  run: function(commandOptions, rawArgs) {
    var packageName = rawArgs[0],
        message;

    commandOptions.name = rawArgs.shift();

    if (!packageName) {
      message = chalk.yellow('The `ember ' + this.name + '` command requires a ' +
                             'name to be specified. For more details, use `ember help`.');

      return Promise.reject(new SilentError(message));
    }

    if (commandOptions.dryRun){
      commandOptions.skipGit = true;
    }

    if (packageName === '.') {
      message = 'Trying to generate an application structure on this folder? Use `ember init` instead.';

      return Promise.reject(new SilentError(message));
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
