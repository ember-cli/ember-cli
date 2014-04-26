'use strict';

var broccoli = require('broccoli');
var Promise  = require('../ext/promise');
var rimraf   = Promise.denodeify(require('rimraf'));
var mkdir    = Promise.denodeify(require('fs').mkdir);
var ncp      = Promise.denodeify(require('ncp'));
var chalk    = require('chalk');
var Task     = require('../task');

var loadBrocfile = require('../utilities/load-brocfile');

module.exports = new Task({
  // Options: String outputPath
  run: function(options) {
    var ui   = this.ui;
    var leek = this.leek;

    ui.pleasantProgress.start(chalk.green('Building'), chalk.green('.'));

    process.env.EMBER_ENV = options.environment || 'development';

    var tree    = loadBrocfile();
    var builder = new broccoli.Builder(tree);
    var start   = new Date();

    return builder.build()
      .then(function(broccoliDir) {
        leek.track({
          name:    'ember build',
          message: 'broccoli rebuild time: ' + (Date.now() - start) + 'ms'
        });

        leek.trackTiming({
          category: 'ember build',
          variable: 'broccoli rebuild time',
          value:    (Date.now() - start) + 'ms'
        });

        return rimraf(options.outputPath)
          .then(function() {
            return mkdir(options.outputPath);
          })
          .then(function() {
            return ncp(broccoliDir, options.outputPath, {
                clobber: true,
                stopOnErr: true
              });
          });
      })
      .finally(function() {
        ui.pleasantProgress.stop();
      })
      .then(function() {
        ui.write(chalk.green('Built project successfully. Stored in "' +
          options.outputPath + '".\n'));
      })
      .catch(function(err) {
        ui.write(chalk.red('Build failed.\n'));

        if (err.file) {
          ui.write('File: ' + err.file + '\n');
        }
        ui.write(err.stack);
      })
      .finally(function() {
        builder.cleanup();
      });
  }
});
