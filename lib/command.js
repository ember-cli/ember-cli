'use strict';

var path               = require('path');
var camelize           = require('./utilities/string').camelize;
var getCallerFile      = require('./utilities/get-caller-file');

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
  this._run = options.run;

  // usageInstructions() method
  if (!options.usageInstructions) {
    throw new Error('Command "' + this.name +
                    '" has no usageInstructions() defined.');
  }
  this._usageInstructions = options.usageInstructions;
}

Command.prototype.run = function(env, options) {
  if (!env) {
    throw new Error('Environemnt parameter missing.');
  }
  return this._run(env, options || {});
};

Command.prototype.usageInstructions = function() {
  return this._usageInstructions();
};
