'use strict';

// Parses the cliArgs, check if all constraints for the specified command are
// fullfilled and if so it returns { command: Object, commandOptions: Object }
// else it return null.

var nopt  = require('nopt');
var chalk = require('chalk');

module.exports = parseCLIArgs;
function parseCLIArgs(environment) {
  var ui = environment.ui;
  var commands = environment.commands;
  var commandName = environment.cliArgs[0];
  var cliArgs = environment.cliArgs;

  // Find the first command which name or one of it's aliases matches
  var command = (function findMatchingCommand() {
    function aliasMatches(alias) { return alias === commandName; }

    for (var key in commands) {
      var command = commands[key];

      if (command.name === commandName || command.aliases.some(aliasMatches)) {
        return command;
      }
    }
  })();

  // Complain if no command was found
  if (!command) {
    ui.write('The specified command ' + chalk.green(commandName) +
             ' is invalid, for available options see ' +
              chalk.green('ember help') + '.\n');
    return null;
  }

  if (command.works === 'insideProject') {
    if (!environment.project) {
      ui.write('You have to be inside an ember-cli project in order to use ' +
               'the ' + chalk.green(commandName) + ' command.\n');
      return null;
    }
  }

  if (command.works === 'outsideProject') {
    if (environment.project) {
      ui.write('You cannot use the '+  chalk.green(commandName) +
               ' command inside an ember-cli project.\n');
      return null;
    }
  }

  // Parse options
  var knownOpts = {};
  command.options.forEach(function(option) {
    knownOpts[option.name] = option.type;
  });
  var parsedOptions = nopt(knownOpts, {}, cliArgs, 1);

  // Set defaults and check if required options are present
  var commandOptions = {};
  var areCommandOptionsValid = command.options.every(function(option) {
    if (parsedOptions[option.name] === undefined) {
      if (option.default !== undefined) {
        commandOptions[option.key] = option.default;
      } else if (option.required) {
        ui.write('The specified command ' + chalk.green(commandName) +
                 ' requires the option ' + chalk.green(option.name) + '.\n');
        return false;
      }
    } else {
      commandOptions[option.key] = parsedOptions[option.name];
    }
    return true;
  });
  if (!areCommandOptionsValid) { return null; }

  return {
    command: command,
    commandOptions: commandOptions
  };
}
