'use strict';

var RSVP = require('rsvp');
var Promise = RSVP.Promise;
var chalk = require('chalk');
var ui = require('../ui');
var fs = require('fs');
var readFile = RSVP.denodeify(fs.readFile);
var merge = require('lodash-node/modern/objects/merge');

module.exports = function bowerInstall() {
  var bower = require('bower'),
      inquirer = require('inquirer');

  return readFile('.bowerrc').then(function(bowerConfig) {
    return new Promise(function(resolve, reject) {
      bower.commands.
        install(undefined, { save: true }, merge(bowerConfig, { interactive: true })).
          on('log', function(message) {
            if (message.level === 'conflict') {
              ui.write('  ' + chalk.red('conflict') + ' ' + message.message + '\n');
              message.data.picks.forEach(function(pick, index) {
                ui.write('    ' + chalk.green((index + 1) + ')') + ' ' + message.data.name + ' ' + pick.endpoint.target + '\n');
              });
            } else {
              if (message.level === 'info') {
                ui.write('  ' + chalk.green(message.id) + ' ' + message.message + '\n');
              }
            }
          }).
          on('error', reject).
          on('end', resolve).
          on('prompt', function (prompts, callback) {
              inquirer.prompt(prompts, callback);
            });
    });
  });
};
