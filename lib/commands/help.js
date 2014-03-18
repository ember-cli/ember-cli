'use strict';

var ui = require('../ui');

module.exports.run = function run() {
  ui.write('ember-cli available commands:\n');
  var commands = require('./commands');
  for (var c in commands){
    if (commands.hasOwnProperty(c)) {
      ui.write('    ' + commands[c].usage.call() + '\n');
    }
  }
};

module.exports.usage = function usage() {
  return 'ember help';
};
