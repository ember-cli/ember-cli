'use strict';

var PleasantProgress = require('pleasant-progress');
var Promise          = require('../ext/promise');

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
}

UI.prototype.write = function(data) { this.outputStream.write(data); };

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
