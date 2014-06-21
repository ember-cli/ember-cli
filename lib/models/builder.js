'use strict';

var fs         = require('fs');
var Promise    = require('../ext/promise');
var rimraf     = Promise.denodeify(require('rimraf'));
var ncp        = Promise.denodeify(require('ncp'));
var broccoli   = require('broccoli');
var Task       = require('./task');

var signalsTrapped = false;

module.exports = Task.extend({
  init: function() {
    this.tree = broccoli.loadBrocfile();
    this.builder = new broccoli.Builder(this.tree);

    process.addListener('exit', this.onExit.bind(this));

    if (!signalsTrapped) {
      process.on('SIGINT',  this.onSIGINT.bind(this));
      process.on('SIGTERM', this.onSIGTERM.bind(this));
      signalsTrapped = true;
    }
  },

  /**
    This is used to ensure that the output path is emptied, but not deleted
    itself. If we simply used `rimraf(this.outputPath)`, any symlinks would
    now be broken. This iterates the direct children of the output path,
    and calls `rimraf` on each (this preserving any symlinks).
  */
  clearOutputPath: function() {
    if (!fs.existsSync(this.outputPath)) { return Promise.resolve();}

    var promises = [];
    var entries = fs.readdirSync(this.outputPath);

    for (var i = 0, l = entries.length, path = entries[i]; i < l; i++) {
      promises.push(rimraf(this.outputPath + '/' + path));
    }

    return Promise.all(promises);
  },

  copyToOutputPath: function(path) {
    return ncp(path, this.outputPath, {
      clobber: true,
      stopOnErr: true
    });
  },

  processBuildResult: function(results) {
    var self = this;

    return this.clearOutputPath()
      .then(function() {
        return self.copyToOutputPath(results.directory);
      })
      .then(function() {
        return results;
      });
  },

  build: function() {
    return this.builder.build.apply(this.builder, arguments)
      .then(this.processBuildResult.bind(this));
  },

  onExit: function() {
    this.builder.cleanup();
  },

  onSIGINT: function() {
    process.exit(1);
  },
  onSIGTERM: function() {
    process.exit(1);
  }
});
