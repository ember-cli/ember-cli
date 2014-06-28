'use strict';

// Runs `npm install` in cwd

var Promise = require('../ext/promise');
var chalk   = require('chalk');
var Task    = require('../models/task');

module.exports = Task.extend({

  init: function() {
    this.npm = this.npm || require('npm');
  },
  // Options: Boolean verbose
  run: function(options) {
    this.ui.pleasantProgress.start(chalk.green('Installing packages for tooling via npm'), chalk.green('.'));

    var npmOptions = {
      loglevel: options.verbose ? 'log' : 'error',
      logstream: this.ui.outputStream,
      color: 'always'
    };

    return new Promise(function(resolve, reject) {

      // npm otherwise is otherwise noisy, already submitted PR for npm to fix
      // misplaced console.log
      this.disableLogger();

      this.npm.load(npmOptions, function(err) {
        if (err) {
          reject(err);
        } else {
          this.npm.commands.install([], function(err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        }
      }.bind(this));

    }.bind(this), 'npm install')
      .finally(this.finally.bind(this))
      .then(this.announceCompletion.bind(this));
  },

  announceCompletion: function() {
    this.ui.write(chalk.green('Installed packages for tooling via npm.\n'));
  },

  finally: function() {
    this.ui.pleasantProgress.stop();
    this.restoreLogger();
  },

  disableLogger: function() {
    this.oldLog = console.log;
    console.log = function() {};
  },

  restoreLogger: function() {
    console.log = this.oldLog; // Hack, see above
  }
});
