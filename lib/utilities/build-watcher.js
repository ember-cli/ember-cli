'use strict';

var error = null;

var Watcher = require('broccoli/lib/watcher');
var chalk   = require('chalk');

module.exports = function(options) {
  options = options || {};

  var watcher = new Watcher(options.builder);

  watcher.on('change', function() {
    if (error) {
      options.ui.write(chalk.green('\n\nBuild successful.\n'));
      error = null;
    }
  });

  watcher.on('error', function(err) {
    error = err;
  });

  return watcher;
};
