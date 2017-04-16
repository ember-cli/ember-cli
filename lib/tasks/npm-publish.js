'use strict';

// Runs `npm publish` in cwd

var Promise = require('../ext/promise');
var chalk   = require('chalk');
var Task    = require('../models/task');

module.exports = Task.extend({

  init: function() {
    this.npm = this.npm || require('npm');
  },
  // Options: Boolean verbose
  run: function(options) {
    this.ui.startProgress(chalk.green('Publishing addon to npm'), chalk.green('.'));

    var npmOptions = {
      loglevel: options.verbose ? 'verbose' : 'error',
      logstream: this.ui.outputStream,
      color: 'always',
      'save-dev': !!options['save-dev'],
      'save-exact': !!options['save-exact']
    };

    return new Promise(function(resolve, reject) {

      // npm otherwise is otherwise noisy, already submitted PR for npm to fix
      // misplaced console.log
      this.disableLogger();

      this.npm.load(npmOptions, function(err) {
        if (err) {
          reject(err);
        } else {
          this.npm.commands.publish([], function(err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        }
      }.bind(this));

    }.bind(this), 'npm publish')
      .finally(this.finally.bind(this))
      .then(this.announceCompletion.bind(this));
  },

  announceCompletion: function() {
    this.ui.writeLine(chalk.green('Published addon to npm.'));
  },

  finally: function() {
    this.ui.stopProgress();
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
