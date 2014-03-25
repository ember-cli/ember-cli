'use strict';

var RSVP = require('rsvp');
var Promise = RSVP.Promise;
var chalk = require('chalk');
var ui = require('../ui');
var inquirer = require('inquirer');
var bower = require('bower');
var bowerConfig = require('bower-config');

module.exports = function bowerInstall() {
  var config = bowerConfig.read();
  config.interactive = true;

  return new Promise(function(resolve, reject) {
    bower.commands.install([], { save: true }, config) // Packages, options, config
      .on('log', log)
      .on('prompt', inquirer.prompt)
      .on('error', reject)
      .on('end', resolve);
  });
};

function log(message) {
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
  } else if (message.level === 'info') {
    // e.g.
    //   cached git://example.com/some-package.git#1.0.0
    ui.write('  ' + chalk.green(message.id) + ' ' + message.message + '\n');
  }
}
