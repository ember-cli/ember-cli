'use strict';

var chalk     = require('chalk');
var reject    = require('lodash-node/modern/collections/reject');
var Command   = require('../models/command');
var Promise   = require('../ext/promise');
var Blueprint = require('../models/blueprint');
var merge     = require('lodash-node/modern/objects/merge');
var EOL       = require('os').EOL;

var SilentError = require('../errors/silent');

module.exports = Command.extend({
  name: 'generate',
  description: 'Generates new code from blueprints.',
  aliases: ['g'],
  works: 'insideProject',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false, aliases: ['d'] },
    { name: 'verbose', type: Boolean, default: false, aliases: ['v'] },
    { name: 'pod', type: Boolean, default: false, aliases: ['p'] }
  ],

  anonymousOptions: [
    '<blueprint>'
  ],

  beforeRun: function(rawArgs){
    // merge in blueprint availableOptions
    var blueprint;
    var debug = require('debug')('ember-cli/commands/generate');

    try{
      blueprint = Blueprint.prototype.lookupBlueprint(rawArgs[0]);
      this.registerOptions( blueprint );
    }
    catch(e) {
      // ignore this error, invalid blueprints are handled in run
      debug(e);
    }
  },

  run: function(commandOptions, rawArgs) {
    var blueprintName = rawArgs[0];

    if (!blueprintName) {
      return Promise.reject(new SilentError('The `ember generate` command requires a ' +
                                            'blueprint name to be specified. ' +
                                            'For more details, use `ember help`.'));
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

  printDetailedHelp: function(options) {
    this.printAllBlueprints(options);
  },

  printAllBlueprints: function(options) {
    var lookupPaths   = this.project.blueprintLookupPaths();
    var blueprintList = Blueprint.list({ paths: lookupPaths });

    this.ui.writeLine('');
    this.ui.writeLine('  Available blueprints:');

    blueprintList.forEach(function(collection) {
      this.printPackageBlueprints(collection, options);
    }, this);
  },

  printPackageBlueprints: function(collection, options) {
    var verbose    = options.verbose;
    var blueprints = collection.blueprints;

    if (!verbose) {
      blueprints = reject(blueprints, 'overridden');
    }

    if (blueprints.length === 0) {
      return;
    }

    this.ui.writeLine('    ' + collection.source + ':');

    blueprints.forEach(function(blueprint) {
      this.printBlueprintInfo(blueprint);
    }, this);
  },

  printBlueprintInfo: function(blueprint) {
    var options;
    var output = '      ';

    if (blueprint.overridden) {
      output += chalk.grey('(overridden) ');
      output += chalk.grey(blueprint.name);
    } else {
      output += blueprint.name;

      blueprint.anonymousOptions.forEach(function(opt) {
        output += ' ' + chalk.yellow('<' + opt + '>');
      });

      options = blueprint.availableOptions || [];

      if (options.length > 0) {
        output += ' ' + chalk.cyan('<options...>');
      }

      if (blueprint.description) {
        output += EOL + '        ' + chalk.grey(blueprint.description);
      }

      if (options.length > 0) {
        options.forEach(function(opt) {
          output += EOL + '        ' + chalk.cyan('--' + opt.name);

          if (opt.values) {
            output += chalk.cyan('=' + opt.values.join('|'));
          }

          if (opt.default !== undefined) {
            output += chalk.cyan(' (Default: ' + opt.default + ')');
          }

          if (opt.required) {
            output += chalk.cyan(' (Required)');
          }

          if (opt.aliases) {
            output += chalk.grey(EOL + '          aliases: ' + opt.aliases.map(function(a) {
              var key;
              if (typeof a === 'string') {
                return '-' + a + (opt.type === Boolean ? '' : ' <value>');
              } else {
                key = Object.keys(a)[0];
                return  '-' + key + ' (--' + opt.name + '=' + a[key] + ')';
              }
            }).join(', '));
          }

          if (opt.description) {
            output += ' ' + opt.description;
          }
        });
      }
    }

    this.ui.writeLine(output);
  }
});
