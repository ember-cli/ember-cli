var bower = require('bower'),
    inquirer = require('inquirer'),
    Promise = require('rsvp').Promise;

module.exports = function bowerInstal() {
  return new Promise(function(resolve, reject) {
    bower.commands.
      install(undefined, { save: true }, { interactive: true }).
        on('log', function(message) { console.log(message); }).
        on('error', reject).
        on('end', resolve).
        on('prompt', function (prompts, callback) {
            inquirer.prompt(prompts, callback);
    });
  });
};
