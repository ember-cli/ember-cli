'use strict';

var through = require('through');
var PleasantProgress = require('./pleasant-progress');

// Note: You should use `ui.stream` and `ui.write()` instead of `process.stdout` and
//       `console.log`. Thus the pleasant progress indicator automatically gets
//       interruped and doesn't mess up the output! -> Convenience :P


var pleasantProgress = new PleasantProgress();

var uiStream = through(function(data) {
  pleasantProgress.stop(true);
  this.emit('data', data);
});
uiStream.pipe(process.stdout);


module.exports = {
  stream: uiStream,
  write: uiStream.write.bind(uiStream),
  startPleasantProgress: pleasantProgress.start.bind(pleasantProgress),
  stopPleasantProgress: pleasantProgress.stop.bind(pleasantProgress)
};
