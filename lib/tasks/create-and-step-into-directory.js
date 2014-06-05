'use strict';

// Creates a directory with the name directoryName in cwd and then sets cwd to
// this directory.

var Promise = require('../ext/promise');
var mkdir   = Promise.denodeify(require('fs').mkdir);
var exists  = Promise.denodeify(require('fs').exists);
var chalk   = require('chalk');
var Task    = require('../models/task');

module.exports = Task.extend({
  // Options: String directoryName
  run: function(options) {
    var ui = this.ui;
    var dryRun = options.commandOptions.dryRun || false;

    if (!dryRun) {
      return mkdir(options.directoryName)
        .catch(function(err) {
          if (err.code === 'EEXIST') {
            ui.write(chalk.yellow('Directory \'' + options.directoryName + '\' already exists.\n'));
            throw undefined;
          } else {
            throw err;
          }
        })
        .then(function() {
          process.chdir(process.cwd() + '/' + options.directoryName);
        });
    } else {
      ui.write(chalk.yellow('You specified the dry-run flag, so no changes will be written.\n'));
      return exists(options.directoryName).then(function() {
        ui.write(chalk.yellow('Create and chdir into \'' + options.directoryName + '\' directory.\n'));
      })
        .catch(function() {
          ui.write(chalk.yellow('Directory \'' + options.directoryName + '\' already exists.\n'));
          throw undefined;
        });
    }
  }
});
