'use strict';

var chalk     = require('chalk');
var Command   = require('../models/command');
var Promise   = require('../ext/promise');
var Blueprint = require('../models/blueprint');

module.exports = Command.extend({
  name: 'generate',
  description: 'Generates new code from blueprints.',
  aliases: ['g'],
  works: 'insideProject',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false },
    { name: 'verbose', type: Boolean, default: false }
  ],

  anonymousOptions: [
    '<blueprint>'
  ],

  run: function(commandOptions, rawArgs) {
    if (commandOptions.list) {
      return this.list();
    } else {
      return this.install(commandOptions, rawArgs);
    }
  },

  install: function(commandOptions, rawArgs) {
    var ui            = this.ui;
    var blueprintName = rawArgs[0];
    var entityName    = rawArgs[1];

    if (!blueprintName) {
      ui.write(chalk.yellow('The `ember generate` command requires a ' +
                            'blueprint name to be specified. ' +
                            'For more details, use `ember help`.\n'));

      return Promise.reject();
    }

    if (!entityName) {
      ui.write(chalk.yellow('The `ember generate` command requires an ' +
                            'entity name to be specified. ' +
                            'For more details, use `ember help`.\n'));

      return Promise.reject();
    }

    var Task = this.tasks.GenerateFromBlueprint;
    var task = new Task({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });

    var taskOptions = {
      dryRun: commandOptions.dryRun,
      verbose: commandOptions.verbose,
      args: rawArgs
    };

    return task.run(taskOptions);
  },

  printDetailedHelp: function() {
    var ui = this.ui;

    ui.write('\n  Available blueprints:\n');

    Blueprint.list().forEach(function(collection) {
      if (collection.blueprints.length) {
        ui.write('    ' + collection.source + ':\n');
        collection.blueprints.forEach(function(blueprint) {
          ui.write('      ' + chalk.yellow(blueprint) + '\n');
        });
      }
    });
  }
});
