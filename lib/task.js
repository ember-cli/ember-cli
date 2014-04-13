'use strict';

var path          = require('path');
var camelize      = require('./utilities/string').camelize;
var getCallerFile = require('./utilities/get-caller-file');

function Task(options) {
  // Name and key
  this.name = options.name || path.basename(getCallerFile(), '.js');
  this.key  = options.key || camelize(this.name);

  // run() method
  if (!options.run) {
    throw new Error('Task ' + this.name + ' has no run() defined.');
  }
  this._run = options.run;
}

module.exports = Task;

Task.prototype.run = function(env, options) {
  if (!env) {
    throw new Error('Environemnt parameter missing.');
  }
  return this._run(env, options || {});
};
