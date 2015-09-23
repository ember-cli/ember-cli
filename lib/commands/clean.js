'use strict';

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

