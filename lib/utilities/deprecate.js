'use strict';

var chalk = require('chalk');

module.exports = function(message, test) {
  if(!test) { return; }

  console.log(chalk.yellow('DEPRECATION: ' + message));
};
