'use strict';

// Runs npm command in cwd. e.g. `install`, `cache clean` etc.,

var chalk = require('chalk');
var Task  = require('../models/task');
var npm   = require('../utilities/npm');
var Promise = require('../ext/promise');

module.exports = Task.extend({
  // The command to run: can be 'install' or 'uninstall'
  command: '',
  // Message to send to ui.startProgress
  startProgressMessage: '',
  // Message to send to ui.writeLine on completion
  completionMessage: '',

  init: function() {
    this.npm = this.npm || require('npm');
  },

  buildOptions: function(options) {
    return {
      loglevel: options.verbose ? 'verbose' : 'error',
      logstream: this.ui.outputStream,
      color: 'always'
    };
  },

  buildArgs: function(/*options*/) {},

  // Options: Boolean verbose
  run: function(options) {
    this.ui.startProgress(chalk.green(this.startProgressMessage), chalk.green('.'));

    var npmOptions = this.buildOptions(options);
    var commandArgs = this.buildArgs(options);

    // npm otherwise is otherwise noisy, already submitted PR for npm to fix
    // misplaced console.log
    this.disableLogger();

    var command = (options.dryRun) ?
      Promise.resolve() :
      npm(this.command, commandArgs, npmOptions, this.npm);

    return command.
      finally(this.finally.bind(this)).
      then(this.announceCompletion.bind(this));
  },

  announceCompletion: function() {
    this.ui.writeLine(chalk.green(this.completionMessage));
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
