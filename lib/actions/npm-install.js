'use strict';

var RSVP = require('rsvp');
var Promise = RSVP.Promise;
var ui = require('../ui');
var chalk = require('chalk');
var npm = require('npm');

module.exports = npmInstall;
function npmInstall(options) {
  options = options || {};

  ui.startPleasantProgress(chalk.green('Installing packages for tooling via npm'),
                           chalk.green('.'));

  // npm otherwise is otherwise noisy, already submitted PR for npm to fix misplaced console.log
  // https://github.com/npm/npm/pull/4941
  var oldLog = console.log;
  console.log = function() {};

  var npmOptions = {
    loglevel: options.verbose ? 'info' : 'error',
    logstream: ui.stream
  };

  return new Promise(function(resolve, reject) {
    npm.load(npmOptions, function (err) {
      if (err) { return reject(err); }
      npm.commands.install([], function (err, data) {
        if (err) { return reject(err); }
        resolve(data);
      });
    });
  }, 'npm install')
  .finally(function() {
    ui.stopPleasantProgress();
    console.log = oldLog; // Hack, see above
  })
  .then(function() {
    ui.write(chalk.green('Installed packages for tooling via npm.\n'));
  });
}
