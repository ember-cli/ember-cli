'use strict';

var broccoli = require('broccoli');
var Promise  = require('../ext/promise');
var rimraf   = Promise.denodeify(require('rimraf'));
var mkdir    = Promise.denodeify(require('fs').mkdir);
var ncp      = Promise.denodeify(require('ncp'));
var chalk    = require('chalk');
var Task     = require('../task');

module.exports = new Task({
  // Options: String outputPath
  run: function(options) {
    this.ui.pleasantProgress.start(chalk.green('Building'), chalk.green('.'));

    process.env.EMBER_ENV = options.environment || 'development';

    var tree    = broccoli.loadBrocfile();
    var builder = new broccoli.Builder(tree);
    var start   = Date.now();
    var self    = this;

    return builder.build()
      .then(function(broccoliDir) {
        self.leek.track({
          name:    'ember build',
          message: 'broccoli rebuild time: ' + (Date.now() - start) + 'ms'
        });

        self.leek.trackTiming({
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
        self.ui.pleasantProgress.stop();
      })
      .then(function() {
        self.ui.write(chalk.green('Built project successfully. Stored in "' +
          options.outputPath + '".\n'));
      })
      .catch(function(err) {
        self.ui.write(chalk.red('Build failed.\n'));

        if (err.file) {
          self.ui.write('File: ' + err.file + '\n');
        }
        self.ui.write(err.stack);
      });
  }
});
