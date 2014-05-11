'use strict';

var Promise          = require('../ext/promise');
var Task             = require('../models/task');
var requireLocal     = require('../utilities/require-local');
var chalk            = require('chalk');

module.exports = Task.extend({
  run: function(options) {
    var pkg = require(this.project.root + '/package');
    var deps = pkg['devDependencies'];

    process.env.EMBER_ENV = options.environment || 'development';

    var taskRunners = {
      grunt: function(grunt, options) {
        return new Promise(function(resolve) {
          grunt.tasks(options.tasks, {}, function() {
            resolve();
          });
        });
      }
    };

    for (var runner in taskRunners) {
      if (deps.hasOwnProperty(runner)) {
        return taskRunners[runner].call(this, requireLocal(runner), options);
      }
    }

    this.ui.write('No task runner found. ' +
                  'Install a task runner such as grunt to use ' +
                  chalk.green('ember run') + '.\n');

    return Promise.resolve();
  }
});
