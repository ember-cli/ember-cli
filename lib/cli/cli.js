'use strict';

var chalk           = require('chalk');
var lookupCommand   = require('./lookup-command');
var Promise         = require('../ext/promise');
var emberCLIVersion = require('../utilities/ember-cli-version');
var UpdateChecker   = require('../models/update-checker');
var getOptionArgs   = require('../utilities/get-option-args');
var EOL             = require('os').EOL;

function CLI(options) {
  this.ui   = options.ui;
  this.analytics = options.analytics;
  this.testing = options.testing;
}

module.exports = CLI;

CLI.prototype.run = function(environment) {
  this.ui.writeLine('version: ' + emberCLIVersion());

  return Promise.hash(environment).then(function(environment) {
    var args = environment.cliArgs.slice();
    var commandName = args.shift();
    var commandArgs = args;

    getOptionArgs('--verbose', commandArgs).forEach(function(arg){
      process.env['EMBER_VERBOSE_' + arg.toUpperCase()] = 'true';
    });

    var CurrentCommand = lookupCommand(environment.commands, commandName, commandArgs, {
      project: environment.project,
      ui: this.ui
    });

    var command = new CurrentCommand({
      ui:        this.ui,
      analytics: this.analytics,
      commands:  environment.commands,
      tasks:     environment.tasks,
      project:   environment.project,
      settings:  environment.settings,
      testing:   this.testing
    });

    var update;

    if (commandName !== 'update' && !this.testing) {
      var a = new UpdateChecker(this.ui, environment.settings);
      update = a.checkForUpdates();
    }

    return Promise.resolve(update).then(function() {
      return command.validateAndRun(commandArgs);
    });

  }.bind(this)).catch(this.logError.bind(this));
};

CLI.prototype.logError = function(error) {
  if (this.testing && error) {
    console.error(error.message);
    console.error(error.stack);
  }

  if (error) {
    if (error instanceof Error) {
      this.ui.writeLine(chalk.red(error.message));

      if (!error.suppressStacktrace) {
        this.ui.writeLine(error.stack.toString().replace(/,/g, EOL));
      }
    } else {
      this.ui.writeLine(chalk.red(error));
    }
  }

  return 1;
};
