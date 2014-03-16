var RSVP = require('rsvp'),
    Promise = RSVP.Promise,
    chalk = require('chalk'),
    ui = require('../ui'),
    fs = require('fs'),
    readFile = RSVP.denodeify(fs.readFile),
    merge = require('lodash-node/modern/objects/merge');

module.exports = function bowerInstall(appRoot) {
  var bower = require('bower'),
      inquirer = require('inquirer');
  return new Promise(function(resolve, reject) {
    readFile('.bowerrc').then(function(bowerConfig) {
      bower.commands.
        install(undefined, { save: true }, merge(bowerConfig, { interactive: true })).
          on('log', function(message) {
            if(message.level == 'conflict') {
              ui.write('  ' + chalk.red('conflict') + ' ' + message.message + '\n');
              message.data.picks.forEach(function(pick, index) {
                ui.write('    ' + chalk.green((index + 1) + ')') + ' ' + message.data.name + ' ' + pick.endpoint.target + '\n');
              });
            } else {
              if(message.level === 'info') {
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
