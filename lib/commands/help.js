'use strict';

var Command       = require('../models/command');
var lookupCommand = require('../cli/lookup-command');
var string        = require('../utilities/string');

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

      if(this.project.initializeAddons && this.project.addonCommands) {
        this.project.initializeAddons();
        var addonCommands = this.project.addonCommands();

        Object.keys(addonCommands).forEach(function(addonName){
          this.commands = addonCommands[addonName];
          this.ui.write('\nAvailable commands from ' + addonName + ':\n');
          Object.keys(this.commands).forEach(this._printBasicHelpForCommand.bind(this));
        }.bind(this));
      }

    } else {
      // If args were passed to the help command,
      // attempt to look up the command for each of them.
      this.ui.write('Requested ember-cli commands:\n\n');

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
