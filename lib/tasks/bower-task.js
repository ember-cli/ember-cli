'use strict';

// Runs `bower` command in cwd

var chalk = require('chalk');
var Task  = require('../models/task');
var Promise = require('../ext/promise');
var findCommand = require('../utilities/package-manager-command');

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

  buildOptions: function(options) {
    return {
      verbose: !!options.verbose
    };
  },

  buildArgs: function(/* options */) {
    return [];
  },

  run: function(options) {
    var bower          = this.bower;
    var bowerConfig    = this.bowerConfig;
    var startProgressMessage = this.startProgressMessage;

    var commandOptions = this.buildOptions(options);
    var commandArgs = this.buildArgs(options);

    this.ui.startProgress(chalk.green(startProgressMessage), chalk.green('.'));

    var config = bowerConfig.read();
    config.interactive = true;

    var command = options.dryRun ?
      Promise.resolve() :
      bowerCommand(this.command, commandArgs, commandOptions, config, bower, this.ui);

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

function logBowerMessage(ui, options) {
  options = options || {};

  return function(message) {
    if (message.level === 'conflict') {
      // e.g.
      //   conflict Unable to find suitable version for ember-data
      //     1) ember-data 1.0.0-beta.6
      //     2) ember-data ~1.0.0-beta.7
      ui.writeLine('  ' + chalk.red('conflict') + ' ' + message.message);
      message.data.picks.forEach(function(pick, index) {
        ui.writeLine('    ' + chalk.green((index + 1) + ')') + ' ' +
                     message.data.name + ' ' + pick.endpoint.target);
      });
    } else if (message.level === 'info' && options.verbose) {
      // e.g.
      //   cached git://example.com/some-package.git#1.0.0
      ui.writeLine('  ' + chalk.green(message.id) + ' ' + message.message);
    }
  };
}

// @todo: align to ../utilities/npm approach
function bowerCommand(commandText, bowerArgs, options, config, bower, ui) {
  return new Promise(function(resolve, reject) {
    var command = findCommand(bower, commandText);

    if (typeof command !== 'function') {
      throw new Error('`bower '+ commandText + '` not found');
    }

    command(bowerArgs, options, config)
      .on('log', logBowerMessage(ui, options))
      .on('prompt', ui.prompt.bind(ui))
      .on('error', reject)
      .on('end', resolve);
  });
}

module.exports = BowerTask;
