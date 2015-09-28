'use strict';

// Runs `bower` command in cwd

var chalk = require('chalk');
var Task  = require('../models/task');
var Promise = require('../ext/promise');
var findCommand = require('../utilities/find-command');

var BowerTask = Task.extend({
  // Any bower command e.g. `bower install`, `bower cache clean`
  command: '',
  // Message to send to ui.startProgress
  startProgressMessage: '',
  // Message to send to ui.writeLine on completion
  completionMessage: '',

  init: function() {
    this.bower = this.bower || require('bower');
    this.bowerConfig = this.bowerConfig || require('bower-config');
  },

  buildOptions: function(/*options*/) {},

  buildArgs: function(/*options*/) {},

  run: function(options) {
    var bower          = this.bower;
    var bowerConfig    = this.bowerConfig;
    var startProgressMessage = this.startProgressMessage;

    var bowerCommandOptions = this.buildOptions(options);
    var bowerCommandArgs = this.buildArgs(options);

    this.ui.startProgress(chalk.green(startProgressMessage), chalk.green('.'));

    var config = bowerConfig.read();
    config.interactive = true;

    return bowerCommand('cache clean', bowerCommandArgs, bowerCommandOptions, bower, this.ui).
      finally(this.finally.bind(this)).
      then(this.announceCompletion.bind(this));
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
function bowerCommand(commandText, bowerArgs, options, bower, ui) {
  var bowerCommands = bower.commands;
  var command = findCommand(bowerCommands, commandText);

  return new Promise(function(resolve, reject) {
    command(bowerArgs)
    .on('log', logBowerMessage(ui, options))
    .on('prompt', ui.prompt.bind(ui))
    .on('error', reject)
    .on('end', resolve);
  });
}

module.exports = BowerTask;
