'use strict';

var RSVP          = require('rsvp');
var chalk         = require('chalk');
var parseCLIArgs  = require('./parse-cli-args');

function CLI(ui) {
  this.ui = ui;
}

module.exports = CLI;

CLI.prototype.run = function(environment) {
  environment.ui = this.ui;

  return RSVP.hash(environment)
    .then(parseCLIArgs)
    .then(function(parsingOutput) {
      // Parse argv, returns null and writes message to ui if it fails
      // If the command was found, run it!
      if (parsingOutput) {
        return parsingOutput.command.run(
          environment,
          parsingOutput.commandOptions
        );
      }
    }).catch(this.logError.bind(this));
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
