'use strict';

var error = null;

var buildBuilder = require('./build-builder');
var Watcher      = require('broccoli/lib/watcher');
var chalk        = require('chalk');

module.exports = function(options) {
  options = options || {};
  var builder = options.builder;

  if (!builder) {
    builder = buildBuilder();
  }
  var watcher = new Watcher(builder);

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
