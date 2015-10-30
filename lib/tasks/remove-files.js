'use strict';

// Creates a directory with the name directoryName in cwd and then sets cwd to
// this directory.

var Promise = require('../ext/promise');
var Task    = require('../models/task');
var _       = require('lodash');
var chalk   = require('chalk');

module.exports = Task.extend({

  init: function() {
    this.rimrafSync  = this.rimrafSync || require('rimraf').sync;
  },

  // Options: String directoryName, Boolean: dryRun

  run: function(options) {
    var ui = this.ui;
    var rimrafSync = this.rimrafSync;

    var paths = this.paths = options.paths;
    if (!_.isArray(paths)) {
      paths = [paths];
    }

    paths = _.compact(paths);
    if (!paths.length) {
      throw new Error('No file paths specified to remove');
    }

    return Promise.resolve().then(function() {
        paths.forEach(function(dirToRemove) {
          if (!options.dryRun) {
            rimrafSync(dirToRemove);
          }

          var withTrailingSlash = ensureWithTrailingSlash(dirToRemove);
          ui.writeLine(chalk.green('Directory \'' + withTrailingSlash + '\' removed'));
        });
    });
  }
});

function ensureWithTrailingSlash(path) {
  var lastChar = path[path.length - 1];
  var hasTrailingSlash = ['/', '\\'].indexOf(lastChar) > -1;
  return hasTrailingSlash ? path : path + '/';
}
