'use strict';

<<<<<<< HEAD
var path    = require('path');
var chalk   = require('chalk');
var Command = require('../models/command');
var Promise = require('../ext/promise');
var rimraf  = require('rimraf');

module.exports = Command.extend({
  name: 'clean',
  description: 'Cleans up the project from downloads(npm/bower), flushes caches and removes build results directories(tmp/ and dist/ by default).',
  works: 'insideProject',
  aliases: ['c'],

  availableOptions: [
    { name: 'dry-run',     type: Boolean, default: false,   aliases: ['d'] },
    { name: 'verbose',     type: Boolean, default: false,   aliases: ['v'] },
    { name: 'skip-npm',    type: Boolean, default: true,   aliases: ['sn'] },
    { name: 'skip-bower',  type: Boolean, default: true,   aliases: ['sb'] },
    { name: 'output-path', type: path,    default: 'dist/', aliases: ['o'] }
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
        dirsToRemove.forEach(function(dirToRemove) {
          rimraf.sync(dirToRemove);

          var withTrailingSlash = ensureWithTrailingSlash(dirToRemove);
          ui.writeLine(chalk.green('Directory \'' + withTrailingSlash + '\' removed'));
        });
      })
      .then(function() {
        ui.writeLine('Project cleaned successfuly');
      }, function(e) {
        ui.writeError(e);
      });
  }
});

function ensureWithTrailingSlash(path) {
  var lastChar = path[path.length - 1];
  var hasTrailingSlash = ['/', '\\'].indexOf(lastChar) > -1;
  return hasTrailingSlash ? path : path + '/';
}
=======
var Command     = require('../models/command');
// var SilentError = require('silent-error');
var Promise     = require('../ext/promise');

module.exports = Command.extend({
  name: 'clean',
  description: 'Cleans npm/bower caches and installation folders',
  works: 'insideProject',

  availableOptions: [
    { name: 'dry-run',    type: Boolean, default: false, aliases: ['d'] },
    { name: 'verbose',    type: Boolean, default: false, aliases: ['v'] },
    { name: 'skip-npm',   type: Boolean, default: false, aliases: ['sn'] },
    { name: 'skip-bower', type: Boolean, default: false, aliases: ['sb'] }
  ],

  run: function(commandOptions) {
    var bowerClean = new this.tasks.BowerClean({
      ui:             this.ui,
      analytics:      this.analytics,
      project:        this.project
    });

    var npmCacheClean = new this.tasks.NpmTask({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      command: 'cache clean',
      startProgressMessage: 'Cleaning Npm cache',
      completionMessage: 'Npm cache cleaning successfully',
    });

    return new Promise(function(resolve, reject) {
      resolve();
    }).then(function() {
      if (!commandOptions.skipBower) {
        return bowerClean.run({
          verbose: commandOptions.verbose
        });
      }
    }).then(function() {
      if (!commandOptions.skipNpm) {
        return npmCacheClean.run({
          verbose: commandOptions.verbose
        });
      }
    });
  }
});

>>>>>>> Introduce clean command
