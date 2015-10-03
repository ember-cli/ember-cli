'use strict';

// Removes bower components directory and cleans bower cache.
// Use `directory` setting from .bowerrc if specified

var Promise = require('../ext/promise');
var Task    = require('../models/task');
var rimraf  = require('rimraf');

module.exports = Task.extend({
  init: function() {
    this.bower = this.bower || require('bower');
    this.bowerConfig = this.bowerConfig || require('bower-config');
  },
  // Options: Boolean verbose
  run: function() {
    var chalk          = require('chalk');
    var bower          = this.bower;
    var bowerConfig    = this.bowerConfig;
    var ui             = this.ui;

    var config = bowerConfig.read();
    var bowerDirectory = config.directory || 'bower_components';

    ui.startProgress(chalk.green('Cleaning Bower'), chalk.green('.'));

    return new Promise(function(resolve, reject) {
      rimraf(bowerDirectory, function(err) {
        if (!err) {
          ui.writeLine(chalk.green('Bower directory \'' + bowerDirectory + '/\' deleted successfully' ));

          // ui.writeLine(chalk.green('Cleaning Bower cache'));
          return new Promise(function(resolve, reject) {
            bower.commands.cache.clean()
              .on('error', reject)
              .on('end', resolve);
          })
          .finally(function() {
            resolve();
            ui.writeLine(chalk.green('Bower cache cleaned successfully'));
          });
        } else {
          reject(err);
        }
      });
    })
    .finally(function() { ui.stopProgress('Bower cleaning'); });
  }
});
