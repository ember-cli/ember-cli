'use strict';

var nopt          = require('nopt');
var chalk         = require('chalk');
var path          = require('path');
var camelize      = require('../utilities/string').camelize;
var getCallerFile = require('../utilities/get-caller-file');
var Promise       = require('../ext/promise');
var defaults      = require('lodash-node/modern/objects/defaults');

var allowedWorkOptions = {
  insideProject: true,
  outsideProject: true,
  everywhere: true
};

module.exports = Command;

var assign = require('lodash-node/modern/objects/assign');

function Command(options) {
  assign(this, options); //TODO: part of default constructor

  this.isWithinProject = this.project.isEmberCLIProject();
  this.name = this.name || path.basename(getCallerFile(), '.js');

  this.aliases = this.aliases || [];

  // Works Property
  if (!allowedWorkOptions[this.works]) {
    throw new Error('The "' + this.name + '" command\'s works field has to ' +
                    'be either "everywhere", "insideProject" or "outsideProject".');
  }

  // Options properties
  this.availableOptions = this.availableOptions || [];
  this.anonymousOptions = this.anonymousOptions || [];

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

Command.prototype.validateAndRun = function(commandArgs) {
  var commandOptions = this.parseArgs(commandArgs);
  if (commandOptions === null) {
    return Promise.reject();
  }
  this.analytics.track({
    name:    'ember ',
    message: this.name
  });

  return this.run(commandOptions.options, commandOptions.args);
};

Command.prototype.parseArgs = function(commandArgs) {
  var knownOpts       = {}; // Parse options
  var commandOptions  = {};
  var ui              = this.ui;
  var commandName     = this.name;
  var settings        = this.settings;
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

      if (settings[option.name] !== undefined) {
        commandOptions[option.key] = settings[option.name];
      } else if (settings[option.key] !== undefined) {
        commandOptions[option.key] = settings[option.key];
      }
    } else {
      commandOptions[option.key] = parsedOptions[option.name];
      delete parsedOptions[option.name];
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

  for (var key in parsedOptions) {
    if(typeof parsedOptions[key] !== 'object') {
      commandOptions[camelize(key)] = parsedOptions[key];
    }
  }

  return {
    options: defaults(commandOptions, this.settings),
    args: parsedOptions.argv.remain
  };
};

Command.prototype.run = function(commandArgs) {
  throw new Error('command must implement run' + commandArgs.toString());
};

/*
  Prints basic help for the command.

  Basic help looks like this:

      ember generate <blueprint> <options...>
        Generates new code from blueprints
        aliases: g
        --dry-run (Default: false)
        --verbose (Default: false)

  The default implementation is designed to cover all bases
  but may be overriden if necessary.

  @method printBasicHelp
*/
Command.prototype.printBasicHelp = function() {
  // ember command-name
  var output = 'ember ' + this.name;

  // <anonymous-option-1> ...
  if (this.anonymousOptions.length > 0) {
    var anonymousOptions = this.anonymousOptions;

    if (anonymousOptions.join) {
      anonymousOptions = anonymousOptions.join(' ');
    }

    output += ' ' + chalk.yellow(anonymousOptions);
  }

  // <options...>
  if (this.availableOptions.length > 0) {
    output += chalk.cyan(' <options...>');
  }

  output += '\n';

  // Description
  if (this.description) {
    output += '  ' + this.description + '\n';
  }

  // aliases: a b c
  if (this.aliases.length) {
    output += chalk.grey('  aliases: ' + this.aliases.filter(function(a) { return a; }).join(', ') + '\n');
  }

  // --available-option (Required) (Default: value)
  // ...
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
};

/*
  Prints detailed help for the command.

  The default implementation is no-op and should be overridden
  for each command where further help text is required.

  @method printDetailedHelp
*/
Command.prototype.printDetailedHelp = function() {};
