'use strict';

var fs          = require('fs');
var path        = require('path');
var Promise     = require('../ext/promise');
var rimraf      = Promise.denodeify(require('rimraf'));
var ncp         = Promise.denodeify(require('ncp'));
var Task        = require('./task');
var SilentError = require('../errors/silent');
var chalk       = require('chalk');

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
      process.on('message', this.onMessage.bind(this));
      signalsTrapped = true;
    }
  },

  init: function() {
    this.setupBroccoliBuilder();
    this.trapSignals();

    this.mkdirp = require('mkdirp');
  },

  canDeleteOutputPath: function(outputPath) {
    return this.project.root.indexOf(outputPath) === -1;
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
      stopOnErr: true,
      limit: 2
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

  processAddonBuildSteps: function(buildStep, results) {
    var addonPromises = [];
    if (this.project && this.project.addons.length) {
      addonPromises = this.project.addons.map(function(addon){
        if (addon[buildStep]) {
          return addon[buildStep](results);
        }
      }).filter(Boolean);
    }

    return Promise.all(addonPromises).then(function() {
      return results;
    });
  },

  build: function() {
    var self = this;
    var args = [];
    for (var i = 0, l = arguments.length; i < l; i++) {
      args.push(arguments[i]);
    }

    return this.processAddonBuildSteps('preBuild')
       .then(function() {
         return self.builder.build.apply(self.builder, args);
       })
      .then(this.processBuildResult.bind(this))
      .then(this.processAddonBuildSteps.bind(this, 'postBuild'))
      .catch(function(error) {
        this.processAddonBuildSteps('buildError', error);
        throw error;
      }.bind(this));
  },

  cleanup: function() {
    var ui = this.ui;

    return this.builder.cleanup().catch(function(err) {
      ui.writeLine(chalk.red('Cleanup error.'));
      ui.writeError(err);
    });
  },

  cleanupAndExit: function() {
    this.cleanup().finally(function() {
      process.exit(1);
    });
  },

  onSIGINT: function() {
    this.cleanupAndExit();
  },
  onSIGTERM: function() {
    this.cleanupAndExit();
  },
  onMessage: function(message) {
    if (message.kill) {
      this.cleanupAndExit();
    }
  }
});
