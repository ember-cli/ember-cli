'use strict';

// Parses the cliArgs, check if all constraints for the specified command are
// fullfilled and if so it returns { command: Object, commandOptions: Object }
// else it return null.

var nopt  = require('nopt');
var chalk = require('chalk');

module.exports = parseCLIArgs;
function parseCLIArgs(environment) {
  var ui              = environment.ui;
  var commands        = environment.commands;
  var commandName     = environment.cliArgs[0];
  var cliArgs         = environment.cliArgs;
  var knownOpts       = {}; // Parse options
  var commandOptions  = {}; // Set defaults and check if required options are present
  var isWithinProject = environment.isWithinProject;
  var parsedOptions;

  var assembleAndValidateOption = function(option) {
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
  };

  // Find the first command which name or one of it's aliases matches
  var command = (function findMatchingCommand() {
    function aliasMatches(alias) {
      return alias === commandName;
    }

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
    if (!isWithinProject) {
      ui.write('You have to be inside an ember-cli project in order to use ' +
               'the ' + chalk.green(commandName) + ' command.\n');
      return null;
    }
  }

  if (command.works === 'outsideProject') {
    if (isWithinProject) {
      ui.write('You cannot use the '+  chalk.green(commandName) +
               ' command inside an ember-cli project.\n');
      return null;
    }
  }

  command.availableOptions.forEach(function(option) {
    knownOpts[option.name] = option.type;
  });

  parsedOptions = nopt(knownOpts, {}, cliArgs, 1);

  if (!command.availableOptions.every(assembleAndValidateOption)) {
    return null;
  }

  return {
    command: command,
    commandOptions: commandOptions
  };
}
