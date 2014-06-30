'use strict';

var Command       = require('../models/command');
var lookupCommand = require('../cli/lookup-command');
var string        = require('../utilities/string');
var assign        = require('lodash-node/modern/objects/assign');

module.exports = Command.extend({
  name: 'help',
  works: 'everywhere',
  description: 'Outputs the usage instructions for all commands or the provided command',
  aliases: [undefined, 'h', 'help', '-h', '--help'],
  anonymousOptions: ['<command-name (Default: all)>'],

  run: function(commandOptions, rawArgs) {
    if (rawArgs.length === 0) {
      // Display usage for all commands.
      this.ui.write('Available commands in ember-cli:\n');

      Object.keys(this.commands).forEach(this._printBasicHelpForCommand.bind(this));

      if(this.project.eachAddonCommand) {
        this.project.eachAddonCommand(function(addonName, commands){
          this.commands = commands;
          this.ui.write('\nAvailable commands from ' + addonName + ':\n');
          Object.keys(this.commands).forEach(this._printBasicHelpForCommand.bind(this));
        }.bind(this));
      }

    } else {
      // If args were passed to the help command,
      // attempt to look up the command for each of them.
      this.ui.write('Requested ember-cli commands:\n\n');

      if(this.project.eachAddonCommand) {
        this.project.eachAddonCommand(function(addonName, commands){
          assign(this.commands, commands);
        }.bind(this));
      }

      // Iterate through each arg beyond the initial 'help' command,
      // and try to display usage instructions.
      rawArgs.forEach(this._printDetailedHelpForCommand.bind(this));
    }
  },

  _printBasicHelpForCommand: function(commandName) {
    this._printHelpForCommand(commandName, false);
  },

  _printDetailedHelpForCommand: function(commandName) {
    this._printHelpForCommand(commandName, true);
  },

  _printHelpForCommand: function(commandName, detailed) {
    var command = this._lookupCommand(commandName);

    command.printBasicHelp();

    if (detailed) {
      command.printDetailedHelp();
    }
  },

  _lookupCommand: function(commandName) {
    var Command = this.commands[string.classify(commandName)] ||
                  lookupCommand(this.commands, commandName);

    return new Command({
      ui: this.ui,
      project: this.project,
      commands: this.commands,
      tasks: this.tasks
    });
  }
});
