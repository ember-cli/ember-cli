'use strict';

// Runs `bower` command in cwd

var chalk = require('chalk');
var Task  = require('../models/task');
var Promise = require('../ext/promise');
var bowerUtil = require('../utilities/bower');

var BowerTask = Task.extend({
  // Any bower command e.g. `bower install`, `bower cache clean`
  command: '',
  // Message to send to ui.startProgress
  startProgressMessage: '',
  // Message to send to ui.writeLine on completion
  completionMessage: '',

  init: function() {
    if (!this.command) {
      throw new Error('Command name is not specified');
    }

    this.bower = this.bower || require('bower');
    this.bowerConfig = this.bowerConfig || require('bower-config');
  },

  buildArgs: function(/* options */) {
    return [];
  },

  run: function(options) {
    var bower          = this.bower;
    var bowerConfig    = this.bowerConfig;
    var startProgressMessage = this.startProgressMessage;

    var commandOptions = {
      verbose: !!options.verbose
    };

    var commandArgs = this.buildArgs(options);

    this.ui.startProgress(chalk.green(startProgressMessage), chalk.green('.'));

    var config = bowerConfig.read();
    config.interactive = true;
    commandArgs.push(config);

    var command = options.dryRun ?
      Promise.resolve() :
      bowerUtil(this.command, commandArgs, bower, commandOptions, this.ui);

    return command.
      finally(this.finally.bind(this)).
      then(this.announceCompletion.bind(this))
      .catch(function(err) {
        this.ui.writeLine(chalk.red(err.message));
        throw err;
      }.bind(this));
  },

  announceCompletion: function() {
    this.ui.writeLine(chalk.green(this.completionMessage));
  },

  finally: function() {
    this.ui.stopProgress();
  }
});

module.exports = BowerTask;
