'use strict';

// Creates a directory with the name directoryName in cwd and then sets cwd to
// this directory.

var Promise = require('../ext/promise');
var mkdir   = Promise.denodeify(require('fs').mkdir);
var chalk   = require('chalk');
var Task    = require('../models/task');

module.exports = Task.extend({
  // Options: String directoryName
  run: function(options) {
    var ui = this.ui;

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
  }
});
