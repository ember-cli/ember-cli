'use strict';

var chalk         = require('chalk');
var path          = require('path');
var camelize      = require('./utilities/string').camelize;
var getCallerFile = require('./utilities/get-caller-file');

var allowedWorkOptions = {
  insideProject: true,
  outsideProject: true,
  everywhere: true
};

module.exports = Command;
function Command(options) {
  var self = this;
  this.name = options.name || path.basename(getCallerFile(), '.js');
  this.key = options.key || camelize(this.name);
  this.aliases = options.aliases || [];
  this.description = options.description || null;

  // Works Property
  this.works = options.works || 'insideProject';
  if (!allowedWorkOptions[this.works]) {
    throw new Error('The "' + this.name + '" command\'s works field has to ' +
                    'be either "everywhere", "insideProject" or "outsideProject".');
  }

  // Options property
  this.availableOptions = options.availableOptions || [];
  this.availableOptions.forEach(function(option) {
    if (!option.name || !option.type) {
      throw new Error('The command "' + this.name + '" has an option ' +
                      'without the required type and name fields.');
    }

    if (option.name !== option.name.toLowerCase()) {
      throw new Error('The "' + option.name + '" option\'s name of the "' +
                       this.name + '" command contains a capital letter.');
    }

    option.key = camelize(option.name);
    option.required = option.required || false;
  });

  // run() method
  if (!options.run) {
    throw new Error('Command "' + this.name + '" has no run() defined.');
  }

  this.run = function(ui, leek, environment, opts) {
    debugger
    if (environment.cliArgs) {
      leek.track(leek.name + ' ' + environment.cliArgs[0] || '', opts.environment ? ', running in ' + opts.environment : '');
      // leek.track(leek.name + ' ' + environment.cliArgs[0] || '', 'Running in ' + opts.environment + ', ' + leek.version);
    }
    options.run.call(self, ui, leek, environment, opts);
  };

  // usageInstructions() method
  this._usageInstructions = options.usageInstructions || function() {};
}

Command.prototype.usageInstructions = function() {
  var docs = this._usageInstructions();

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

    return output;
  }
};
