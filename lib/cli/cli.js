'use strict';

var chalk           = require('chalk');
var CommandFactory  = require('./command-factory');
var Promise         = require('../ext/promise');

function CLI(ui, leek) {
  this.ui   = ui;
  this.leek = leek;
}

module.exports = CLI;

CLI.prototype.run = function(environment) {
  this.ui.write('version: ' + require('../../package.json').version + '\n');

  return Promise.hash(environment).then(function(environment) {
    var parsingOutput = new CommandFactory({
      ui: this.ui,
      commands: environment.commands,
      isWithinProject: environment.isWithinProject
    }).commandFromArgs(environment.cliArgs);

    if (parsingOutput) {
      parsingOutput.command.ui   = this.ui;
      parsingOutput.command.leek = this.leek;

      return parsingOutput.command.run(
        environment,
        parsingOutput.commandOptions
      );
    }
  }.bind(this)).catch(this.logError.bind(this));
};

CLI.prototype.logError = function(error) {
  if (error) {
    if (error instanceof Error) {
      this.ui.write(chalk.red(error.message));
      this.ui.write(error.stack.toString().replace(/,/g, '\n'));
    } else {
      this.ui.write(chalk.red(error));
    }
  }
};
