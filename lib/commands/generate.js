'use strict';

var chalk = require('chalk');

module.exports.run = function run() {
  var args = Array.prototype.slice.call(arguments);
  require('loom')(args.join(' '));
};

module.exports.usage = function usage() {
  return 'ember generate ' + chalk.yellow('<generator-name>') + ' <options...> ' + chalk.green('See https://github.com/cavneb/loom-generators-ember-appkit for available generators');
};
