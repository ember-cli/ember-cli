var Promise = require('rsvp').Promise;

module.exports = function prompt(name) {
  return new Promise(function (resolve, reject) {
    process.stdin.once('data', function (data) {
      resolve(data);
    });
  }, 'prompt: ' + name);
};
