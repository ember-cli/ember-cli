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

  this.run = options.run;

  // usageInstructions() method
  this._usageInstructions = options.usageInstructions || function() {};
}

Command.prototype.usageInstructions = function() {
  var docs = this._usageInstructions();

  if (typeof docs === 'string') {
    return docs;
  } else {
    var output = chalk.green('ember ' + this.name);

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
        output += chalk.yellow('  --' + option.name);

        if (option.required) {
          output += chalk.cyan(' (Required)');
        }

        if (option.default !== undefined) {
          output += chalk.magenta(' (Default: ' + option.default + ')');
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
