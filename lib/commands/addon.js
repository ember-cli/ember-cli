'use strict';

var chalk        = require('chalk');
var Command      = require('../models/command');
var Promise      = require('../ext/promise');
var path         = require('path');
var NULL_PROJECT = require('../models/project').NULL_PROJECT;

var validProjectName = require('../utilities/valid-project-name');

module.exports = Command.extend({
  name: 'addon',
  description: 'Creates a new folder and runs ' + chalk.green('ember init') + ' in it.',
  works: 'outsideProject',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false },
    { name: 'verbose', type: Boolean, default: false },
    { name: 'blueprint', type: path, default: 'addon' },
    { name: 'skip-npm', type: Boolean, default: false },
    { name: 'skip-bower', type: Boolean, default: false }
  ],

  anonymousOptions: [
    '<addon-name>'
  ],

  run: function(commandOptions, rawArgs) {
    var packageName = rawArgs[0];

    if (!packageName) {
      this.ui.write(chalk.yellow('The `ember addon` command requires an ' +
               'addon-name to be specified. For more details, use `ember help`.\n'));

      return Promise.reject();
    }


    if (!validProjectName(packageName)) {
      this.ui.write('We currently do not support an addon name of `' + packageName + '`.');
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
      project: NULL_PROJECT
    });

    return createAndStepIntoDirectory
      .run({
        directoryName: packageName
      })
      .then(initCommand.run.bind(initCommand, commandOptions, rawArgs));
  },
});
