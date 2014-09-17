'use strict';

var path       = require('path');
var runCommand = require('./run-command');

module.exports = function(appName, options) {
  options = options || {};
  options.command = options.command || 'new';

  return runCommand(path.join('..', 'bin', 'ember'), options.command, '--skip-git', appName, {
    onOutput: function() {
      return; // no output for initial application build
    }
  })
  .catch(function(result) {
    console.log(result.output.join('\n'));
    console.log(result.errors.join('\n'));

    throw result;
  });
};
