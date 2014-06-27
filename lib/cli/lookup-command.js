'use strict';
var chalk   = require('chalk');
var Command = require('../models/command');

var UnknownCommand = Command.extend({
  printBasicHelp: function() {
    this.ui.write(chalk.red('No help entry for \'' + this.commandName + '\'\n'));
  },

  validateAndRun: function() {
    this.ui.write('The specified command ' + chalk.green(this.commandName) +
                  ' is invalid, for available options see ' +
                  chalk.green('ember help') + '.\n');
  }
});

module.exports = function(commands, commandName, commandArgs) {
  // special case help
  if (commandArgs && (commandArgs.indexOf('--help') > -1 || commandArgs.indexOf('-h') > -1)) {
    commandArgs.splice(0);
    commandArgs.push(commandName);
    commandName = 'help';
  }

  function aliasMatches(alias) {
    return alias === commandName;
  }

  for (var key in commands) {
    var command = commands[key];

    var name = command.prototype.name;
    var aliases = command.prototype.aliases || [];

    if (name === commandName || aliases.some(aliasMatches)) {
      return command;
    }
  }

  // if we didn't find anything, return an "UnknownCommand"
  return UnknownCommand.extend({
    commandName: commandName
  });
};
