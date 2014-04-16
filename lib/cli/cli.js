'use strict';

var chalk         = require('chalk');
var parseCLIArgs  = require('./parse-cli-args');
var Promise       = require('../ext/promise');
var Leek          = require('leek');
var packageConfig = require('../../package.json');
var version       = packageConfig.version;
var name          = packageConfig.name;
var trackingCode  = packageConfig.trackingCode;

function CLI(ui) {
  this.ui = ui;

  this.leek = new Leek({
    trackingCode: trackingCode,
    name:         name,
    version:      version
  });
}

module.exports = CLI;

CLI.prototype.run = function(environment) {
  this.ui.write('version: ' + require('../../package.json').version + '\n');

  return Promise.hash(environment).then(function(environment) {
    var parsingOutput = parseCLIArgs(this.ui, environment);

    // Parse argv, returns null and writes message to ui if it fails
    // If the command was found, run it!
    if (parsingOutput) {
      return parsingOutput.command.run(
        this.ui,
        environment,
        parsingOutput.commandOptions,
        this.leek
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
