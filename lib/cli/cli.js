'use strict';

var RSVP          = require('rsvp');
var chalk         = require('chalk');
var parseCLIArgs  = require('./parse-cli-args');

function CLI(ui) {
  this.ui = ui;
}

module.exports = CLI;

CLI.prototype.run = function(environment) {
  return RSVP.hash(environment)
    .then(function(environment) {
      var parsingOutput = parseCLIArgs(this.ui, environment);
      // Parse argv, returns null and writes message to ui if it fails
      // If the command was found, run it!
      if (parsingOutput) {
        return parsingOutput.command.run(
          this.ui,
          environment,
          parsingOutput.commandOptions
        );
      }
    }.bind(this))
    .catch(this.logError.bind(this));
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
