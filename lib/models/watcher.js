'use strict';

var chalk   = require('chalk');
var Task    = require('./task');
var logger  = require('heimdalljs-logger')('ember-cli:watcher');

var Watcher = Task.extend({
  verbose: true,

  init: function() {
    this._super.apply(this, arguments);

    var options = this.buildOptions();

    logger.info('initialize %o', options);

    this.watcher = this.watcher || this.constructWatcher(options);

    this.watcher.on('error', this.didError.bind(this));
    this.watcher.on('change', this.didChange.bind(this));
  },

  constructWatcher: function(options) {
    return new (require('ember-cli-broccoli-sane-watcher'))(this.builder, options);
  },

  didError: function(error) {
    logger.info('didError %o', error);
    this.ui.writeError(error);
    this.analytics.trackError({
      description: error && error.message
    });
  },

  then: function() {
    return this.watcher.then.apply(this.watcher, arguments);
  },

  didChange: function(results) {
    logger.info('didChange %o', results);

    var totalTime = results.totalTime / 1e6;

    this.ui.writeLine('');
    this.ui.writeLine(chalk.green('Build successful - ' + Math.round(totalTime) + 'ms.'));

    this.analytics.track({
      name:    'ember rebuild',
      message: 'broccoli rebuild time: ' + totalTime + 'ms'
    });

    /*
     * We use the `rebuild` category in our analytics setup for both builds
     * and rebuilds. This is a bit confusing, but the actual thing we
     * delineate on in the reports is the `variable` value below. This is
     * used both here and in `lib/tasks/build.js`.
     */
    this.analytics.trackTiming({
      category: 'rebuild',
      variable: 'rebuild time',
      label:    'broccoli rebuild time',
      value:    Number(totalTime)
    });
  },

  on: function() {
    this.watcher.on.apply(this.watcher, arguments);
  },

  off: function() {
    this.watcher.off.apply(this.watcher, arguments);
  },

  buildOptions: function() {
    var watcher = this.options && this.options.watcher;

    if (watcher && ['polling', 'watchman', 'node', 'events'].indexOf(watcher) === -1) {
      throw new Error('Unknown watcher type --watcher=[polling|watchman|node] but was: ' + watcher);
    }

    return {
      verbose:  this.verbose,
      poll:     watcher === 'polling',
      watchman: watcher === 'watchman' || watcher === 'events',
      node:     watcher === 'node'
    };
  }
});

module.exports = Watcher;
