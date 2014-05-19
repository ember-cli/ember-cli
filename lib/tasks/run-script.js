'use strict';

var Promise          = require('../ext/promise');
var Task             = require('../models/task');
var chalk            = require('chalk');
var npm              = require('npm');

module.exports = Task.extend({

  run: function(options) {


    process.env.EMBER_ENV = options.environment || 'development';

    var pkg = require(this.project.root + '/package');
    var scripts = pkg.scripts;
    var tasks = options.tasks;
    var taskName = tasks[0];
    var self = this;

    return new Promise(function(resolve, reject) {

      npm.load(pkg, function(err, npm) {
        if (err) { return reject(err); }

        if (!scripts.hasOwnProperty(taskName)) {
          self.ui.write(chalk.yellow('warning: ') + '"' + taskName + '" ' +
                        'was not found in package.scripts\n');
        }

        npm.commands['run-script'](tasks, function(err) {
          if (err) { return reject(err); }
          return resolve();
        });

      });

    });

  }

});
