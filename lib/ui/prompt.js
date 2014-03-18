'use strict';

var Promise = require('rsvp').Promise;

module.exports = function prompt(name) {
  return new Promise(function (resolve) {
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', function (data) {
      if(data === '\u0003') {
        process.exit();
      }
      resolve(data);
    });
  }, 'prompt: ' + name);
};
