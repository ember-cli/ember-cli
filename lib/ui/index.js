'use strict';

var through          = require('through');
var PleasantProgress = require('./pleasant-progress');

// Note: You should use `ui.stream` and `ui.write()` instead of `process.stdout` and
//       `console.log`. Thus the pleasant progress indicator automatically gets
//       interruped and doesn't mess up the output! -> Convenience :P

module.exports = UI;
function UI(options) { // options === { inputStream, outputStream }
  var pleasantProgress = this.pleasantProgress = new PleasantProgress();

  // Output stream
  this.outputStream = through(function(data) {
    pleasantProgress.stop(true);
    this.emit('data', data);
  });
  this.outputStream.pipe(options.outputStream);

  this.inputStream = options.inputStream;
}

UI.prototype.write = function(data) { this.outputStream.write(data); };
