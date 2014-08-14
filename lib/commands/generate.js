'use strict';

var chalk     = require('chalk');
var Command   = require('../models/command');
var Promise   = require('../ext/promise');
var Blueprint = require('../models/blueprint');
var merge     = require('lodash-node/modern/objects/merge');

var SilentError = require('../errors/silent');

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
    var blueprintName = rawArgs[0];

    if (!blueprintName) {
      return Promise.reject(new SilentError('The `ember generate` command requires a ' +
                                            'blueprint name to be specified. ' +
                                            'For more details, use `ember help`.\n'));
    }

    var Task = this.tasks.GenerateFromBlueprint;
    var task = new Task({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      testing: this.testing
    });

    var taskArgs = {
      args: rawArgs
    };

    var taskOptions = merge(taskArgs, commandOptions || {});

    if (this.project.initializeAddons) {
      this.project.initializeAddons();
    }

    return task.run(taskOptions);
  },

  printDetailedHelp: function() {
    var ui = this.ui;

    ui.write('\n  Available blueprints:\n');

    Blueprint.list({ paths: this.project.blueprintLookupPaths() })
      .forEach(function(collection) {
        if (collection.blueprints.length) {
          ui.write('    ' + collection.source + ':\n');
          collection.blueprints.forEach(function(blueprint) {
            ui.write('      ' + chalk.yellow(blueprint) + '\n');
          });
        }
      });
  }
});
