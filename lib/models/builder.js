'use strict';

var fs          = require('fs');
var path        = require('path');
var Promise     = require('../ext/promise');
var rimraf      = Promise.denodeify(require('rimraf'));
var ncp         = Promise.denodeify(require('ncp'));
var Task        = require('./task');
var SilentError = require('../errors/silent');

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

    this.mkdirp = require('mkdirp');
  },

  canDeleteOutputPath: function(outputPath) {
    return !this.project.root.contains(outputPath);
  },

  /**
    This is used to ensure that the output path is emptied, but not deleted
    itself. If we simply used `rimraf(this.outputPath)`, any symlinks would
    now be broken. This iterates the direct children of the output path,
    and calls `rimraf` on each (this preserving any symlinks).
  */
  clearOutputPath: function() {
    var outputPath = this.outputPath;
    if (!fs.existsSync(outputPath)) { return Promise.resolve();}

    if(!this.canDeleteOutputPath(outputPath)) {
      return Promise.reject(new SilentError('Using a build destination path of `' + outputPath + '` is not supported.'));
    }

    var promises = [];
    var entries = fs.readdirSync(outputPath);

    for (var i = 0, l = entries.length; i < l; i++) {
      promises.push(rimraf(path.join(outputPath, entries[i])));
    }

    return Promise.all(promises);
  },

  copyToOutputPath: function(inputPath) {
    if (!fs.existsSync(this.outputPath)) {
      this.mkdirp.sync(this.outputPath);
    }

    return ncp(inputPath, this.outputPath, {
      dereference: true,
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
