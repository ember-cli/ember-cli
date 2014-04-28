'use strict';

var error = null;

var buildBuilder = require('./build-builder');
var chalk        = require('chalk');
var helpers      = require('broccoli-kitchen-sink-helpers');
var RSVP         = require('rsvp');
var rimraf       = RSVP.denodeify(require('rimraf'));
var EventEmitter = require('events').EventEmitter;

module.exports = function(options) {
  options = options || {};
  var builder = options.builder;

  if (!builder) {
    builder = buildBuilder();
  }
  var watcher = new Watcher(builder);

  watcher.on('change', function() {
    if (error) {
      options.ui.write(chalk.green('\n\nBuild successful.\n'));
      error = null;
    }
  });

  watcher.on('error', function(err) {
    error = err;
  });

  return watcher;
};

function Watcher(builder) {
  this.builder = builder;
  this.check();
}

Watcher.prototype = Object.create(EventEmitter.prototype);
Watcher.prototype.constructor = Watcher;

Watcher.prototype.check = function() {
  try {
    var newStatsHash = this.builder.treesRead.map(function (tree) {
      return typeof tree === 'string' ? helpers.hashTree(tree) : '';
    }).join('\x00');
    if (newStatsHash !== this.statsHash) {
      this.current = this.builder.build();
      this.current
        .then(function(directory) {
          this.statsHash = newStatsHash;
          this.emit('change', directory);
        }.bind(this),
        function(error) {
          if (error.code !== 'EPERM'     &&
              error.code !== 'ENOTEMPTY' &&
              error.code !== 'EBUSY'     &&
              error.code !== 'ENOENT'      )
          {
            this.emit('error', error);
            this.statsHash = newStatsHash;
          } else {
            console.log('Build error (' + error.code + ') - gracefully rebuilding...');
            var dir = error.path.replace(/(.*\\tmp\\[^\\]*)\\.*/, '$1');
            return rimraf(dir);
          }
        }.bind(this))
        .finally(this.check.bind(this));
    } else {
      setTimeout(this.check.bind(this), 100);
    }
  } catch (err) {
    console.error('Uncaught error in Broccoli file watcher:');
    console.error(err.stack);
    console.error('Watcher quitting'); // do not schedule check with setTimeout
  }
};

Watcher.prototype.then = function(success, fail) {
  return this.current.then(success, fail);
};
