'use strict';

// Loads tasks and assembles them into a hash.

var RSVP = require('rsvp');
var glob = RSVP.denodeify(require('glob'));
var path = require('path');
var camelize = require('../utilities/string').camelize;

module.exports = loadTasks;
function loadTasks() {
  return glob(__dirname + '/../tasks/*.js').then(buildHash);
}

function buildHash(files) {
  return files.reduce(function(tasks, file) {
    var task = require(file);

    // Set optional properties
    task.name = task.name || path.basename(file, '.js');
    task.key = task.key || camelize(task.name);

    if (!task.run) {
      throw new Error('Task ' + task.name + ' has no run() defined.');
    }

    // Add task to tasks hash
    tasks[task.key] = task;

    return tasks;
  }, {});
}
