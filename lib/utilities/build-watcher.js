'use strict';

var error = null;

var buildBuilder = require('./build-builder');
var Watcher      = require('broccoli/lib/watcher');
var chalk        = require('chalk');

var printSlowTrees = require('broccoli/lib/logging').printSlowTrees;

module.exports = function(options) {
  options = options || {};
  var builder = options.builder;

  if (!builder) {
    builder = buildBuilder();
  }

  var watcher = new Watcher(builder);

  watcher.on('change', function(results) {
    var totalTime = results.totalTime / 1e6;

    // default to verbose if not specified
    if (!options.hasOwnProperty('verbose') || options.verbose) {
      printSlowTrees(results.graph);
    }

    options.ui.write(chalk.green('\n\nBuild successful - ' + Math.round(totalTime) + 'ms.\n'));

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
