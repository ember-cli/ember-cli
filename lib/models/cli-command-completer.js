'use strict';

var find        = require('lodash/collection/find');
var omelette    = require('omelette');
var Generator   = require('./cli-command-generator');

function CliCommandCompleter() {
  this.completion = omelette('ember');
  var generator = new Generator();
  this.template = generator.generateJSON(generator.root);
}

CliCommandCompleter.prototype.run = function() {

  this.completion.on('complete', this.handleInput).init();

};

CliCommandCompleter.prototype.handleInput = function(fragment, word, line) {

  var intent = {
    arguments: this.getArgs(line),
    isPremature: this.isPremature(line),
    seeksOptions: this.seeksOptions(line)
  };

  this.completion.reply(this.getResult(intent));

};

CliCommandCompleter.prototype.getArgs = function(line) {
  return line.split(/\s+/).filter(function(cmd) {
    return cmd !== '';
  });
};

CliCommandCompleter.prototype.isPremature = function(line) {
  return !line.match(/\s+$/);
};

CliCommandCompleter.prototype.seeksOptions = function(line) {
  return !!line.match(/\s+-+[^\s]*$/);
};

CliCommandCompleter.prototype.getCommand = function(intent) {
  var command = intent.arguments.reduce(function(parentCommand, term) {

    var command = this.findCommand(parentCommand.commands, term);

    if (!command) {
      return intent.isPremature ? parentCommand : {};
    }

    // remember options of parent command
    command.options = command.options.concat(parentCommand.options || []);
    return command;

  }.bind(this), this.template );

  return command.name ? command : null;
};

CliCommandCompleter.prototype.findCommand = function(commands, term) {
  return find(commands, function(command) {
    var nameMatches = command.name === term;
    var aliasMatches = command.aliases.indexOf(term) > -1;
    return nameMatches || aliasMatches;
  });
};


CliCommandCompleter.prototype.getResult = function(intent) {

  var command = this.getCommand(intent);

  if (!command) {
    return [];
  }

  if (intent.seeksOptions) {
    return command.options.map(function(option) {
      return '--' + option.name + (option.type === 'Boolean' ? '' : '=');
    });
  } else {
    return command.commands.map(function(command) {
      return command.name;
    });
  }

};

module.exports = CliCommandCompleter;
