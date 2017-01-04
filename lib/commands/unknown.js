'use strict';

let Command = require('../models/command');
let SilentError = require('silent-error');
let chalk = require('chalk');

module.exports = Command.extend({
  skipHelp: true,
  unknown: true,

  printBasicHelp() {
    return chalk.red(`No help entry for '${this.name}'`);
  },

  validateAndRun() {
    throw new SilentError(`The specified command ${this.name} is invalid. For available options, see \`ember help\`.`);
  },
});
