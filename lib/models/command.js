'use strict';

var nopt          = require('nopt');
var chalk         = require('chalk');
var path          = require('path');
var camelize      = require('../utilities/string').camelize;
var getCallerFile = require('../utilities/get-caller-file');
var Promise       = require('../ext/promise');

var allowedWorkOptions = {
  insideProject: true,
  outsideProject: true,
  everywhere: true
};

module.exports = Command;

function Command(options) {
  this.ui = options.ui;
  this.analytics = options.analytics;
  this.commands = options.commands;
  this.tasks = options.tasks;
  this.project = options.project;
  this.isWithinProject = this.project.isEmberCLIProject();

  this.name = this.name || path.basename(getCallerFile(), '.js');

  this.aliases = this.aliases || [];

  // Works Property
  if (!allowedWorkOptions[this.works]) {
    throw new Error('The "' + this.name + '" command\'s works field has to ' +
                    'be either "everywhere", "insideProject" or "outsideProject".');
  }

  // Options property
  this.availableOptions = this.availableOptions || [];
  var self = this;
  this.availableOptions.forEach(function(option) {
    if (!option.name || !option.type) {
      throw new Error('The command "' + self.name + '" has an option ' +
                      'without the required type and name fields.');
    }

    if (option.name !== option.name.toLowerCase()) {
      throw new Error('The "' + option.name + '" option\'s name of the "' +
                       self.name + '" command contains a capital letter.');
    }

    option.key = camelize(option.name);
    option.required = option.required || false;
  });
}

Command.__proto__ = require('./core-object');

Command.prototype.description = null;
Command.prototype.works = 'insideProject';
Command.prototype.constructor = Command;
Command.prototype.usageInstructions = function() { };

Command.prototype.validateAndRun = function(commandArgs) {
  var commandOptions = this.parseArgs(commandArgs);
  if (commandOptions === null) {
    return Promise.reject();
  }
  this.analytics.track({
    name:    'ember ',
    message: this.name
  });
  return this.run(commandOptions, commandArgs);
};

Command.prototype.parseArgs = function(commandArgs) {
  var knownOpts       = {}; // Parse options
  var commandOptions  = {}; // Set defaults and check if required options are present
  var ui = this.ui;
  var commandName = this.name;
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

  if (this.works === 'insideProject') {
    if (!this.isWithinProject) {
      this.ui.write('You have to be inside an ember-cli project in order to use ' +
               'the ' + chalk.green(this.name) + ' command.\n');
      return null;
    }
  }

  if (this.works === 'outsideProject') {
    if (this.isWithinProject) {
      this.ui.write('You cannot use the '+  chalk.green(this.name) +
               ' command inside an ember-cli project.\n');
      return null;
    }
  }
  this.availableOptions.forEach(function(option) {
    knownOpts[option.name] = option.type;
  });

  parsedOptions = nopt(knownOpts, {}, commandArgs, 0);

  if (!this.availableOptions.every(assembleAndValidateOption)) {
    return null;
  }
  return commandOptions;
};

Command.prototype.run = function(commandArgs) {
  throw new Error('command must implement run' + commandArgs.toString());
};

Command.prototype.printUsageInstructions = function() {
  var docs = this.usageInstructions();

  if (typeof docs === 'string') {
    return docs;
  } else {
    var output = 'ember ' + this.name;

    if (docs && docs.anonymousOptions) {
      output += ' ' + chalk.yellow(docs.anonymousOptions);
    }

    if (this.availableOptions.length > 0) {
      output += chalk.yellow(' <options...>');
    }

    output += '\n';

    if (this.description) {
      output += '  ' + this.description + '\n';
    }

    if (this.availableOptions.length > 0) {
      this.availableOptions.forEach(function(option) {
        output += chalk.cyan('  --' + option.name);

        if (option.required) {
          output += chalk.cyan(' (Required)');
        }

        if (option.default !== undefined) {
          output += chalk.cyan(' (Default: ' + option.default + ')');
        }

        if (option.description) {
          output += ' ' + option.description;
        }

        output += '\n';
      });
    }
    this.ui.write(output);
  }
};
