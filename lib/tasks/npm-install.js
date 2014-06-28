'use strict';

// Runs `npm install` in cwd

var Promise = require('../ext/promise');
var chalk   = require('chalk');
var Task    = require('../models/task');
var path    = require('path');
var ncp     = Promise.denodeify(require('ncp'));
var fs      = require('fs');

module.exports = Task.extend({

  init: function() {
    this.npm = this.npm || require('npm');
    this.loadNPM = Promise.denodeify(this.npm.load);
  },
  // Options: Boolean verbose
  run: function(options) {
    this.ui.pleasantProgress.start(chalk.green('Installing packages for tooling via npm'), chalk.green('.'));

    var npmOptions = {
      loglevel: options.verbose ? 'log' : 'error',
      logstream: this.ui.outputStream,
      color: 'always'
    };

    fs.mkdirSync('node_modules');

    var source = path.join(__dirname, '..', '..');
    var destination = path.join(process.cwd(), 'node_modules', 'ember-cli');

    return ncp(source, destination).then(function() {
        // npm otherwise is otherwise noisy, already submitted PR for npm to fix
        // misplaced console.log
        this.disableLogger();
        return this.loadNPM(npmOptions);
      }.bind(this))
      .then(function() {
        return Promise.denodeify(this.npm.commands.install)([]);
      }.bind(this))
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
