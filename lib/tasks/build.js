'use strict';

var RSVP     = require('rsvp');
var broccoli = require('broccoli');
var rimraf   = RSVP.denodeify(require('rimraf'));
var mkdir    = RSVP.denodeify(require('fs').mkdir);
var ncp      = RSVP.denodeify(require('ncp'));
var chalk    = require('chalk');
var Task     = require('../task');

module.exports = new Task({
  // Options: String outputPath
  run: function(environment, options) {
    var ui = environment.ui;

    ui.pleasantProgress.start(chalk.green('Building'), chalk.green('.'));

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
      });
  }
});
