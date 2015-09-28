'use strict';

var path    = require('path');
var chalk    = require('chalk');
var Command     = require('../models/command');
var Promise     = require('../ext/promise');
var rimraf     = require('rimraf');

module.exports = Command.extend({
  name: 'clean',
  description: 'Cleans up the project from downloads(npm/bower), flushes caches and removes build results directories(tmp/ and dist/ by default).',
  works: 'insideProject',
  aliases: ['c'],

  availableOptions: [
    { name: 'dry-run',     type: Boolean, default: false,   aliases: ['d'] },
    { name: 'verbose',     type: Boolean, default: false,   aliases: ['v'] },
    { name: 'skip-npm',    type: Boolean, default: false,   aliases: ['sn'] },
    { name: 'skip-bower',  type: Boolean, default: false,   aliases: ['sb'] },
    { name: 'output-path', type: path,    default: 'dist/', aliases: ['o'] }
  ],

  run: function(commandOptions) {
    var npmDirectory = 'node_modules',
      bowerDirectory,
      outputDir = commandOptions.outputPath,
      tmpDir = 'tmp',
      bowerCacheClean,
      npmCacheClean,
      ui = this.ui;

    if (!commandOptions.skipBower) {
      bowerCacheClean = new this.tasks.BowerCacheClean({
        ui:             ui,
        analytics:      this.analytics,
        project:        this.project
      });

      var bowerConfig = this.bowerConfig || require('bower-config');
      var config = bowerConfig.read();
      bowerDirectory = config.directory || 'bower_components';
      console.log(bowerDirectory);
    }

    if (!commandOptions.skipNpm) {
      npmCacheClean = new this.tasks.NpmCacheClean({
        ui: ui,
        analytics: this.analytics,
        project: this.project
      });
    }

    return Promise.resolve()
      .then(function() {
        if (!commandOptions.skipBower) {
          return bowerCacheClean.run({
            verbose: commandOptions.verbose
          });
        }
      })
      .then(function() {
        if (!commandOptions.skipNpm) {
          return npmCacheClean.run({
            verbose: commandOptions.verbose
          });
        }
      })
      .then(function() {
        var dirsToRemove = [ bowerDirectory, tmpDir, outputDir ];
        dirsToRemove.forEach(function(dirToRemove) {
          rimraf.sync(dirToRemove);
          ui.writeLine(chalk.green(
            'Directory \'' + dirToRemove + '\' removed'
          ));
        });
      })
      .finally(function() {
        ui.writeLine('Project cleaned successfuly');
      });
  }
});

