'use strict';

var keypress = require('./keypress');

module.exports = function confirm(question) {
  var stdin = process.stdin;
  var stdout = process.stdout;

  stdin.resume();
  stdout.write(question + ' (y/n/q) ');
  if (stdin.setRawMode) {
    stdin.setRawMode(true);
  }

  return keypress(stdin).then(function (data) {
    if (data === 'y') {
      return true;
    } else if (data === 'q') {
      stdout.write('\n');
      process.exit(1);
    } else {
      return false;
    }
  }).finally(function () {
    stdout.write('\n');
    stdin.pause();
  });
};
