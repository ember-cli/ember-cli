'use strict';
var chalk = require('chalk');

module.exports = function writeError(ui, error){
  if (!error) { return; }

  if (error.file) {
    var file = error.file;
    if (error.line) {
      file += error.col ? ' (' + error.line + ':' + error.col + ')' : ' (' + error.line + ')';
    }
    ui.writeLine(chalk.red('File: ' + file), 'ERROR');
  }

  if (error.message) {
    ui.writeLine(chalk.red(error.message), 'ERROR');
  } else {
    ui.writeLine(chalk.red(error), 'ERROR');
  }

  if (error.stack) {
    ui.writeLine(error.stack, 'ERROR');
  }
};
