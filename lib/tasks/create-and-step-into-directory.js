'use strict';

// Creates a directory with the name directoryName in cwd and then sets cwd to
// this directory.

var RSVP  = require('rsvp');
var mkdir = RSVP.denodeify(require('fs').mkdir);
var chalk = require('chalk');
var Task  = require('../task');

module.exports = new Task({
  filename: __filename,
  // Options: String directoryName
  run: function(environment, options) {
    var ui = environment.ui;

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
