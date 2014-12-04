'use strict';

var PleasantProgress = require('pleasant-progress');
var Promise          = require('../ext/promise');
var EOL              = require('os').EOL;
var writeError       = require('./write-error');

// Note: You should use `ui.outputStream`, `ui.inputStream` and `ui.write()`
//       instead of `process.stdout` and `console.log`.
//       Thus the pleasant progress indicator automatically gets
//       interruped and doesn't mess up the output! -> Convenience :P

module.exports = UI;

function UI(options) { // options === { inputStream, outputStream }
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

  // Input stream
  this.inputStream = options.inputStream;

  this.writeLevel = options.writeLevel || 'INFO';
}

UI.prototype.write = function(data, writeLevel) {
  if (this.writeLevelVisible(writeLevel)) {
    this.outputStream.write(data);
  }
};

UI.prototype.writeLine = function(data, writeLevel) {
  if (this.writeLevelVisible(writeLevel)) {
    this.write(data + EOL);
  }
};

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
    this.pleasantProgress.start(message, stepString);
  }
};

UI.prototype.stopProgress = function(printWithFullStepString) {
  this.pleasantProgress.stop(printWithFullStepString);
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
  writeLevel = writeLevel || 'INFO';

  return levels[writeLevel] >= levels[this.writeLevel];
};
