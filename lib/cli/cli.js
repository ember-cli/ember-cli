'use strict';

var RSVP          = require('rsvp');
var chalk         = require('chalk');
var parseCLIArgs  = require('./parse-cli-args');

module.exports = CLI;
function CLI(ui) {
  this.ui = ui;
}

CLI.prototype.run = function(environment) {
  environment.ui = this.ui;

  return RSVP.hash(environment)
  .then(function(environment) {
    // Parse argv, returns null and writes message to ui if it fails
    var parsingOutput = parseCLIArgs(environment);
    // If the command was found, run it!
    if (parsingOutput) {
      return parsingOutput.command.run(
        environment,
        parsingOutput.commandOptions
      );
    }
  }).catch(this.logError.bind(this));
};

CLI.prototype.logError = function (error) {
  if (error) {
    if (error instanceof Error) {
      this.ui.write(chalk.red(error.message));
      this.ui.write(error.stack.toString().replace(/,/g, '\n'));
    } else {
      this.ui.write(chalk.red(error));
    }
  }
};
