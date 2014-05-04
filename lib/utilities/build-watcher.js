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

  watcher.on('change', function(results) {
    if (error) {
      options.ui.write(chalk.green('\n\nBuild successful.\n'));
      error = null;
    }

    var totalTime = results.totalTime / 1e6;
    options.analytics.track({
      name:    'ember rebuild',
      message: 'broccoli rebuild time: ' + totalTime + 'ms'
    });

    options.analytics.trackTiming({
      category: 'ember rebuild',
      variable: 'broccoli rebuild time',
      value:    totalTime + 'ms'
    });
  });

  watcher.on('error', function(err) {
    error = err;
  });

  return watcher;
};
