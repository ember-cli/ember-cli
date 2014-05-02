'use strict';

// Runs `npm install` in cwd

var Promise = require('../ext/promise');
var chalk   = require('chalk');
var Task    = require('../models/task');

module.exports = Task.extend({
  // Options: Boolean verbose
  run: function(options) {
    var npm = require('npm');
    var ui = this.ui;

    ui.pleasantProgress.start(chalk.green('Installing packages for tooling via npm'),
                              chalk.green('.'));

    // npm otherwise is otherwise noisy, already submitted PR for npm to fix misplaced console.log
    var oldLog = console.log;
    console.log = function() {};

    var npmOptions = {
      loglevel: options.verbose ? 'log' : 'error',
      logstream: ui.outputStream,
      color: 'always'
    };

    return new Promise(function(resolve, reject) {
        npm.load(npmOptions, function(err) {
          if (err) { return reject(err); }
          npm.commands.install([], function(err, data) {
            if (err) { return reject(err); }
            resolve(data);
          });
        });
      }, 'npm install')
      .finally(function() {
        ui.pleasantProgress.stop();
        console.log = oldLog; // Hack, see above
      })
      .then(function() {
        ui.write(chalk.green('Installed packages for tooling via npm.\n'));
      });
  }
});
