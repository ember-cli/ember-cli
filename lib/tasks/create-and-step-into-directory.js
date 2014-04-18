'use strict';

// Creates a directory with the name directoryName in cwd and then sets cwd to
// this directory.

var Promise = require('../ext/promise');
var mkdir = Promise.denodeify(require('fs').mkdir);
var chalk = require('chalk');
var Task  = require('../task');

module.exports = new Task({
  // Options: String directoryName
  run: function(options) {
    var self = this;

    return mkdir(options.directoryName)
      .catch(function(err) {
        if (err.code === 'EEXIST') {
          self.ui.write(chalk.yellow('Directory \'' + options.directoryName + '\' already exists.\n'));
          self.leek.trackError({
            description: err.message + ' ' + err.stack,
            isFatal:     false
          });
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
