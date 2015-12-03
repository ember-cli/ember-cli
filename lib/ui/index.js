'use strict';

var PleasantProgress = require('pleasant-progress');
var Promise          = require('../ext/promise');
var EOL              = require('os').EOL;
var chalk            = require('chalk');
var writeError       = require('./write-error');

var DEFAULT_WRITE_LEVEL = 'INFO';

// Note: You should use `ui.outputStream`, `ui.inputStream` and `ui.write()`
//       instead of `process.stdout` and `console.log`.
//       Thus the pleasant progress indicator automatically gets
//       interrupted and doesn't mess up the output! -> Convenience :P

module.exports = UI;

/*
  @constructor

  The UI provides the CLI with a unified mechanism for providing output and
  requesting input from the user. This becomes useful when wanting to adjust
  logLevels, or mock input/output for tests.

  new UI({
    inputStream: process.stdin,
    outputStream: process.stdout,
    writeLevel: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR',
    ci: true | false
  });

**/

function UI(options) {
  var pleasantProgress = this.pleasantProgress = new PleasantProgress();

  this.through  = require('through');
  this.readline = require('readline2');

  // Output stream
  this.actualOuputStream = options.outputStream;
  this.outputStream      = this.through(function(data) {
    pleasantProgress.stop(true);
    this.emit('data', data);
  });

  this.outputStream.setMaxListeners(0);
  this.outputStream.pipe(this.actualOuputStream);

  this.inputStream = options.inputStream;
  this.errorStream = options.errorStream;

  this.writeLevel = options.writeLevel || DEFAULT_WRITE_LEVEL;
  this.ci = !!options.ci;
}

/**
  Unified mechanism to write a string to the console.
  Optionally include a writeLevel, this is used to decide if the specific
  logging mechanism should or should not be printed.

  @method write
  @param {String} data
  @param {Number} writeLevel
*/
UI.prototype.write = function(data, writeLevel) {
  if (writeLevel === 'ERROR') {
    this.errorStream.write(data);
  } else if (this.writeLevelVisible(writeLevel)) {
    this.outputStream.write(data);
  }
};

/**
  Unified mechanism to write a string and new line to the console.
  Optionally include a writeLevel, this is used to decide if the specific
  logging mechanism should or should not be printed.
  @method writeLine
  @param {String} data
  @param {Number} writeLevel
*/
UI.prototype.writeLine = function(data, writeLevel) {
  this.write(data + EOL, writeLevel);
};

/**
  Helper method to write a string with the DEBUG writeLevel and gray chalk
  @method writeDebugLine
  @param {String} data
*/
UI.prototype.writeDebugLine = function(data) {
  this.writeLine(chalk.gray(data), 'DEBUG');
};

/**
  Helper method to write a string with the INFO writeLevel and cyan chalk
  @method writeInfoLine
  @param {String} data
*/
UI.prototype.writeInfoLine = function(data) {
  this.writeLine(chalk.cyan(data), 'INFO');
};

/**
  Helper method to write a string with the WARNING writeLevel and yellow chalk.
  Optionally include a test. If falsy, the warning will be printed. By default, warnings
  will be prepended with WARNING text when printed.
  @method writeWarnLine
  @param {String} data
  @param {Boolean} test
  @param {Boolean} prepend
*/
UI.prototype.writeWarnLine = function(data, test, prepend) {
  if (test) { return; }

  data = this.prependLine('WARNING', data, prepend);
  this.writeLine(chalk.yellow(data), 'WARNING', test);
};

/**
  Helper method to write a string with the WARNING writeLevel and yellow chalk.
  Optionally include a test. If falsy, the deprecation will be printed. By default deprecations
  will be prepended with DEPRECATION text when printed.
  @method writeDeprecateLine
  @param {String} data
  @param {Boolean} test
  @param {Boolean} prepend
*/
UI.prototype.writeDeprecateLine = function(data, test, prepend) {
  data = this.prependLine('DEPRECATION', data, prepend);
  this.writeWarnLine(data, test, false);
};

/**
  Utility method to prepend a line with a flag-like string (i.e., WARNING).
  @method prependLine
  @param {String} prependData
  @param {String} data
  @param {Boolean} prepend
*/
UI.prototype.prependLine = function(prependData, data, prepend) {
  if (typeof prepend === 'undefined' || prepend) {
    data = prependData + ': ' + data;
  }

  return data;
};

/**
  Unified mechanism to an Error to the console.
  This will occure at a writeLevel of ERROR

  @method writeError
  @param {Error} error
*/
UI.prototype.writeError = function(error) {
  writeError(this, error);
};

/**
  Sets the write level for the UI. Valid write levels are 'DEBUG', 'INFO',
  'WARNING', and 'ERROR'.

  @method setWriteLevel
  @param {String} level
*/
UI.prototype.setWriteLevel = function(level) {
  if (Object.keys(this.WRITE_LEVELS).indexOf(level) === -1) {
    throw new Error('Unknown write level. Valid values are \'DEBUG\', \'INFO\', \'WARNING\', and \'ERROR\'.');
  }

  this.writeLevel = level;
};

UI.prototype.startProgress = function(message, stepString) {
  if (this.writeLevelVisible('INFO')) {
    if (this.ci) {
      this.writeLine(message);
    } else {
      this.pleasantProgress.start(message, stepString);
    }
  }
};

UI.prototype.stopProgress = function(printWithFullStepString) {
  if (this.writeLevelVisible('INFO') && !this.ci) {
    this.pleasantProgress.stop(printWithFullStepString);
  }
};

UI.prototype.prompt = function(questions, callback) {
  // Pipe it to the output stream but don't forward end event
  var promtOutputStream = this.through(null, function() {});
  promtOutputStream.pipe(this.outputStream);

  var Prompt = require('inquirer').ui.Prompt;
  // Note: Cannot move this outside
  //       Need a new readline interface each time, 'cause it gets torn down
  function PromptExt() {
    Prompt.apply(this, arguments);
  }
  PromptExt.prototype = Object.create(Prompt.prototype);
  PromptExt.prototype.constructor = PromptExt;
  PromptExt.prototype.rl = this.readline.createInterface({
    input: this.inputStream,
    output: promtOutputStream
  });

  // If no callback was provided, automatically return a promise
  if (callback) {
    return new PromptExt(questions, callback);
  } else {
    return new Promise(function(resolve) {
      new PromptExt(questions, resolve);
    });
  }
};

/**
  @property WRITE_LEVELS
  @private
  @type Object
*/
UI.prototype.WRITE_LEVELS = {
  'DEBUG': 1,
  'INFO': 2,
  'WARNING': 3,
  'ERROR': 4
};

/**
  Whether or not the specified write level should be printed by this UI.

  @method writeLevelVisible
  @private
  @param {String} writeLevel
  @return {Boolean}
*/
UI.prototype.writeLevelVisible = function(writeLevel) {
  var levels = this.WRITE_LEVELS;
  writeLevel = writeLevel || DEFAULT_WRITE_LEVEL;

  return levels[writeLevel] >= levels[this.writeLevel];
};
