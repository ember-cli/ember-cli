'use strict';

var path = require('path');
var camelize = require('./utilities/string').camelize;

module.exports = Task;
function Task(options) {
  if (!options.name && !options.filename) {
    throw new Error('You must either provide the name or filename.');
  }

  // Name and key
  this.name = options.name || path.basename(options.filename, '.js');
  this.key  = options.key || camelize(this.name);

  // run() method
  if (!options.run) {
    throw new Error('Task ' + task.name + ' has no run() defined.');
  }
  this._run = options.run;
}

Task.prototype.run = function(env, options) {
  if (!env) {
    throw new Error('Environemnt parameter missing.')
  }
  return this._run(env, options || {});
}
