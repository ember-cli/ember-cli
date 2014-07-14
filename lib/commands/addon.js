'use strict';

var chalk       = require('chalk');
var Command     = require('../models/command');
var Promise     = require('../ext/promise');
var path        = require('path');
var NULL_PROJECT = require('../models/project').NULL_PROJECT;

var validProjectName = require('../utilities/valid-project-name');

module.exports = Command.extend({
  name: 'addon',
  description: 'Creates a new folder and runs ' + chalk.green('ember new') + ' in it and uses the addon blueprint for the project.',
  works: 'outsideProject',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false },
    { name: 'verbose', type: Boolean, default: false },
    { name: 'blueprint', type: path, default: 'addon' },
    { name: 'skip-npm', type: Boolean, default: false },
    { name: 'skip-bower', type: Boolean, default: false }
  ],

  anonymousOptions: [
    '<new>',
    '<app-name>'
  ],

  run: function(commandOptions, rawArgs) {
    var type = rawArgs.shift();
    var packageName = rawArgs[0];

    if (type !== 'new') {
      this.ui.write(chalk.yellow('The `ember addon` command requires `new` to be ' +
               'specified before the addon-name. For more details, use `ember help`.\n'));
      return Promise.reject();
    }

    if (type === 'new') {
      if (!packageName) {
        this.ui.write(chalk.yellow('The `ember addon new` command requires an ' +
                 'addon-name to be specified. For more details, use `ember help`.\n'));

        return Promise.reject();
      }

      if (!validProjectName(packageName)) {
        this.ui.write('We currently do not support an addon name of `' + packageName + '`.');

        return Promise.reject();
      }

      var NewCommand = this.commands.New;

      var newCommand = new NewCommand({
        ui:        this.ui,
        commands:  this.commands,
        analytics: this.analytics,
        tasks:     this.tasks,
        project:   NULL_PROJECT
      });

      return newCommand.run.call(newCommand, commandOptions, rawArgs);
    }
  }
});
