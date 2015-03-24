'use strict';

// Runs `npm uninstall` in cwd

var Promise = require('../ext/promise');
var chalk   = require('chalk');
var Task    = require('../models/task');

module.exports = Task.extend({

  init: function() {
    this.npm = this.npm || require('npm');
  },
  // Options: Boolean verbose
  run: function(options) {
    this.ui.startProgress(chalk.green('Uninstalling packages for tooling via npm'), chalk.green('.'));

    var npmOptions = {
      loglevel: options.verbose ? 'verbose' : 'error',
      logstream: this.ui.outputStream,
      color: 'always',
      'save-dev': !!options['save-dev'],
      'save-exact': !!options['save-exact']
    };
    var packages = options.packages || [];

    // npm otherwise is otherwise noisy, already submitted PR for npm to fix
    // misplaced console.log
    this.disableLogger();

    var load = Promise.denodeify(this.npm.load);

    return load(npmOptions)
      .then(function() {
        // if uninstall is denodeified outside load.then(),
        // it throws "Call npm.load(config, cb) before using this command."
        var uninstall = Promise.denodeify(this.npm.commands.uninstall);

        return uninstall(packages);
      }.bind(this))
      .finally(this.finally.bind(this))
      .then(this.announceCompletion.bind(this));
  },

  announceCompletion: function() {
    this.ui.writeLine(chalk.green('Uninstalled packages for tooling via npm.'));
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
