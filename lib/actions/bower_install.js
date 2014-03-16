var bower = require('bower');
var inquirer = require('inquirer');
var Promise = require('rsvp').Promise;
var chalk = require('chalk');
var ui = require('../ui');

module.exports = function bowerInstal() {
  return new Promise(function(resolve, reject) {
    bower.commands.
      install(undefined, { save: true }, { interactive: true }).
        on('log', function(message) {
          if (message.level === 'conflict') {
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
};
