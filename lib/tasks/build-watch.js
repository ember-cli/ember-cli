'use strict';

var chalk    = require('chalk');
var Task     = require('../models/task');
var Watcher  = require('../models/watcher');
var Builder  = require('../models/builder');

module.exports = Task.extend({
  run: function(options) {
    var env = options.environment || 'development';
    process.env.EMBER_ENV = process.env.EMBER_ENV || env;

    this.ui.pleasantProgress.start(
      chalk.green('Building'), chalk.green('.')
    );

    return new Watcher({
      ui: this.ui,
      builder: new Builder({outputPath: options.outputPath}),
      analytics: this.analytics,
      options: options
    });
  }
});
