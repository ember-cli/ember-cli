'use strict';

var nopt  = require('nopt');
var chalk = require('chalk');

function findCommand(commands, commandName) {
  function aliasMatches(alias) {
    return alias === commandName;
  }

  for (var key in commands) {
    var command = commands[key];

    if (command.name === commandName || command.aliases.some(aliasMatches)) {
      return command;
    }
  }
}

function CommandFactory(options){
  this.ui = options.ui;
  this.commands = options.commands;
  this.project = options.project;
}

// Parses the cliArgs, check if all constraints for the specified command are
// fullfilled and if so it returns { command: Object, commandOptions: Object }
// else it return null.
CommandFactory.prototype.commandFromArgs = function(cliArgs) {
  var ui              = this.ui;
  var commands        = this.commands;
  var commandName     = cliArgs[0];
  var knownOpts       = {}; // Parse options
  var commandOptions  = {}; // Set defaults and check if required options are present
  var project         = this.project;
  var parsedOptions;

  // TODO: clean this up
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

  var command = findCommand(commands, commandName);

  if (!command) {
    this.ui.write('The specified command ' + chalk.green(commandName) +
             ' is invalid, for available options see ' +
              chalk.green('ember help') + '.\n');
    return null;
  }

  if (command.works === 'insideProject') {
    if (!project.isEmberCLIProject()) {
      this.ui.write('You have to be inside an ember-cli project in order to use ' +
               'the ' + chalk.green(commandName) + ' command.\n');
      return null;
    }
  }

  if (command.works === 'outsideProject') {
    if (project.isEmberCLIProject()) {
      this.ui.write('You cannot use the '+  chalk.green(commandName) +
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
};

module.exports = CommandFactory;
