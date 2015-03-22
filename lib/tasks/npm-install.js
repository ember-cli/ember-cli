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
    this.ui.startProgress(chalk.green('Installing packages for tooling via npm'), chalk.green('.'));

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
        // if install is denodeified outside load.then(),
        // it throws "Call npm.load(config, cb) before using this command."
        var install = Promise.denodeify(this.npm.commands.install);

        return install(packages);
      }.bind(this))
      .finally(this.finally.bind(this))
      .then(this.announceCompletion.bind(this));
  },

  announceCompletion: function(data) {
    this.printPackageNames(data);
    this.ui.writeLine(chalk.green('Installed packages for tooling via npm.'));
  },

  printPackageNames: function(data) {
    data.forEach(function(pkg) {
      var name = pkg[0];
      var path = pkg[1];

      this.ui.writeLine(chalk.green(name + ' ' + path));
    }.bind(this));
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
