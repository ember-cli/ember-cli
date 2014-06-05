'use strict';

var chalk           = require('chalk');
var lookupCommand   = require('./lookup-command');
var Promise         = require('../ext/promise');
var emberCLIVersion = require('../utilities/ember-cli-version');
var checkForUpdates = require('../utilities/check-for-updates');

function CLI(options) {
  this.ui   = options.ui;
  this.analytics = options.analytics;
  this.testing = options.testing;
}

module.exports = CLI;

CLI.prototype.run = function(environment) {
  var _this = this;
  this.ui.write('version: ' + emberCLIVersion() + '\n');

  return Promise.hash(environment).then(function(environment) {
    var args = environment.cliArgs.slice();
    var commandName = args.shift();
    var commandArgs = args;
    var CurrentCommand = lookupCommand(environment.commands, commandName, commandArgs);
    var command = new CurrentCommand({
      ui:        this.ui,
      analytics: this.analytics,
      commands:  environment.commands,
      tasks:     environment.tasks,
      project:   environment.project,
      settings:  environment.settings
    });

    return new Promise(function(resolve) {
      // if the 'checkForUpdates' setting is true, check for an updated ember-cli version
      // if environment.settings is undefined, that means there is no .ember-cli file, so check by default
      if(commandName !== 'update' && (typeof environment.settings === 'undefined' || environment.settings.checkForUpdates)) {
        checkForUpdates(_this.ui, environment).then(function(updateInfo) {
          if(updateInfo.updateNeeded) {
            _this.ui.write('\nA new version of ember-cli is available (' + updateInfo.newestVersion + '). To install it, type ' + chalk.green('ember update') + '.\n');
          }
          resolve();
        });
      } else {
        resolve();
      }
    }).then(function() {
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
      this.ui.write(chalk.red(error.message));
      this.ui.write(error.stack.toString().replace(/,/g, '\n'));
    } else {
      this.ui.write(chalk.red(error));
    }
  }
};
