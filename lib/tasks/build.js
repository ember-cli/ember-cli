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
  run: function(ui, options) {
    ui.pleasantProgress.start(chalk.green('Building'), chalk.green('.'));

    process.env.EMBER_ENV = options.environment || 'development';

    var tree    = broccoli.loadBrocfile();
    var builder = new broccoli.Builder(tree);

    return builder.build()
      .then(function(broccoliDir) {
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
      });
  }
});
