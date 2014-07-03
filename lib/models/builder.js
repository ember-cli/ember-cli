'use strict';

var fs         = require('fs');
var path       = require('path');
var Promise    = require('../ext/promise');
var rimraf     = Promise.denodeify(require('rimraf'));
var copy       = Promise.denodeify(require('wrench').copyDirRecursive);
var Task       = require('./task');

var signalsTrapped = false;

module.exports = Task.extend({
  setupBroccoliBuilder: function() {
    this.environment = this.environment || 'development';
    process.env.EMBER_ENV = process.env.EMBER_ENV || this.environment;

    var broccoli = require('broccoli');
    this.tree    = broccoli.loadBrocfile();
    this.builder = new broccoli.Builder(this.tree);
  },

  trapSignals: function() {
    if (!signalsTrapped) {
      process.on('SIGINT',  this.onSIGINT.bind(this));
      process.on('SIGTERM', this.onSIGTERM.bind(this));
      signalsTrapped = true;
    }
  },

  cleanupOnExit: function() {
    process.addListener('exit', this.onExit.bind(this));
  },

  init: function() {
    this.setupBroccoliBuilder();
    this.cleanupOnExit();
    this.trapSignals();
  },

  eachDirectoryEntry: function(dir, callback) {
    var promises = [];
    var entries = fs.readdirSync(dir);

    for (var i = 0, l = entries.length; i < l; i++) {
      promises.push(callback(entries[i]));
    }

    return Promise.all(promises);
  },

  /**
    This is used to ensure that the output path is emptied, but not deleted
    itself. If we simply used `rimraf(this.outputPath)`, any symlinks would
    now be broken. This iterates the direct children of the output path,
    and calls `rimraf` on each (this preserving any symlinks).
  */
  clearOutputPath: function() {
    if (!fs.existsSync(this.outputPath)) { return Promise.resolve();}

    return this.eachDirectoryEntry(this.outputPath, function(entry) {
      return rimraf(path.join(this.outputPath, entry));
    }.bind(this));
  },

  copyToOutputPath: function(sourcePath) {
    return this.eachDirectoryEntry(sourcePath, function(entry) {
      var source = path.join(sourcePath, entry);
      var dest   = path.join(this.outputPath, entry);
      var stat   = fs.statSync(source);

      if (stat.isDirectory()) {
        return copy(source, dest, {
          forceDelete: true,
          inflateSymlinks: true,
        });
      } else {
        return new Promise(function(resolve) {
          var input  = fs.createReadStream(source);
          var output = fs.createWriteStream(dest);
          input.pipe(output);

          input.on('end', resolve);
        });
      }
    }.bind(this));
  },

  symlinkToOutputPath: function(sourcePath) {
    return this.eachDirectoryEntry(sourcePath, function(entry) {
      var source = path.join(sourcePath, entry);
      var dest   = path.join(this.outputPath, entry);
      var stat   = fs.lstatSync(source);

      if (stat.isSymbolicLink()) {
        source = fs.readlinkSync(source);
      }

      fs.symlinkSync(source, dest);
    }.bind(this));
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

  addonsPostBuild: function(results){
    var addonPromises = [];

    if(this.project && this.project.addons.length) {
      addonPromises = this.project.addons.map(function(addon){
        if(addon.postBuild) {
          return addon.postBuild(results);
        }
      }).filter(Boolean);
    }

    return Promise.all(addonPromises).then(function() {
      return results;
    });
  },

  build: function() {
    return this.builder.build.apply(this.builder, arguments)
      .then(this.processBuildResult.bind(this))
      .then(this.addonsPostBuild.bind(this));
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
