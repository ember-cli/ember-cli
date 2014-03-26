'use strict';

var RSVP = require('rsvp');
var Promise = RSVP.Promise;
var ui = require('../ui');
var chalk = require('chalk');
var inquirer = require('inquirer');
var bower = require('bower');
var bowerConfig = require('bower-config');

module.exports = bowerInstall;
function bowerInstall(options) {
  options = options || {};

  ui.startPleasantProgress(chalk.green('Installing browser packages via Bower'), chalk.green('.'));

  var config = bowerConfig.read();
  config.interactive = true;

  return new Promise(function(resolve, reject) {
    bower.commands.install([], { save: true }, config) // Packages, options, config
      .on('log', logBowerMessage)
      .on('prompt', inquirer.prompt)
      .on('error', reject)
      .on('end', resolve);
  })
  .finally(function() { ui.stopPleasantProgress(); })
  .then(function() {
    ui.write(chalk.green('Installed browser packages via Bower.\n'));
  });

  function logBowerMessage(message) {
    if (message.level === 'conflict') {
      // e.g.
      //   conflict Unable to find suitable version for ember-data
      //     1) ember-data 1.0.0-beta.6
      //     2) ember-data ~1.0.0-beta.7
      ui.write('  ' + chalk.red('conflict') + ' ' + message.message + '\n');
      message.data.picks.forEach(function(pick, index) {
        ui.write('    ' + chalk.green((index + 1) + ')') + ' ' +
                 message.data.name + ' ' + pick.endpoint.target + '\n');
      });
    } else if (message.level === 'info' && options.verbose) {
      // e.g.
      //   cached git://example.com/some-package.git#1.0.0
      ui.write('  ' + chalk.green(message.id) + ' ' + message.message + '\n');
    }
  }
}
