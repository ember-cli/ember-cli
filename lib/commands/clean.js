'use strict';

var path    = require('path');
var Command = require('../models/command');
var Promise = require('../ext/promise');

module.exports = Command.extend({
  name: 'clean',
  description: 'Removes installed packages, flushes caches and removes build files(tmp/ and dist/ by default).',
  works: 'insideProject',
  aliases: ['c'],

  availableOptions: [
    { name: 'dry-run',     type: Boolean, default: false,   aliases: ['d'] },
    { name: 'verbose',     type: Boolean, default: false,   aliases: ['v'] },
    { name: 'skip-npm',    type: Boolean, default: false,   aliases: ['sn'] },
    { name: 'skip-bower',  type: Boolean, default: false,   aliases: ['sb'] },
    { name: 'output-path', type: path,    default: 'dist/', aliases: ['o', 'out'] }
  ],

  run: function(commandOptions) {
    var npmDirectory = 'node_modules',
      bowerDirectory,
      outputDir = commandOptions.outputPath,
      tmpDir = 'tmp',
      bowerCacheClean,
      npmCacheClean,
      ui = this.ui,
      dirsToRemove = [ tmpDir, outputDir ];

    if (!commandOptions.skipBower) {
      bowerCacheClean = new this.tasks.BowerCacheClean({
        ui:             ui,
        analytics:      this.analytics,
        project:        this.project
      });

      var bowerConfig = this.bowerConfig || require('bower-config');
      var config = bowerConfig.read();
      bowerDirectory = config.directory || 'bower_components';

      dirsToRemove.push(bowerDirectory);
    }

    if (!commandOptions.skipNpm) {
      npmCacheClean = new this.tasks.NpmCacheClean({
        ui: ui,
        analytics: this.analytics,
        project: this.project
      });

      dirsToRemove.push(npmDirectory);
    }

    var removeFilesTask = new this.tasks.RemoveFiles({
        ui: ui,
        analytics: this.analytics,
        project: this.project
    });

    return Promise.resolve()
      .then(function() {
        if (!commandOptions.skipNpm) {
          return npmCacheClean.run({
            verbose: commandOptions.verbose,
            dryRun: commandOptions.dryRun
          });
        }
      })
      .then(function() {
        if (!commandOptions.skipBower) {
          return bowerCacheClean.run({
            verbose: commandOptions.verbose,
            dryRun: commandOptions.dryRun
          });
        }
      })
      .then(function() {
        return removeFilesTask.run({
            paths: dirsToRemove,
            verbose: commandOptions.verbose,
            dryRun: commandOptions.dryRun
        });
      })
      .then(function() {
        ui.writeLine('Project cleaned up successfuly');
      }, function(e) {
        ui.writeError(e);
      });
  }
});

