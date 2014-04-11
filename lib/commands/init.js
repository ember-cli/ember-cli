'use strict';

var chalk   = require('chalk');
var path    = require('path');
var Command = require('../command');

module.exports = new Command({
  works: 'everywhere',

  availableOptions: [
    { name: 'dry-run', type: Boolean },
    { name: 'verbose', type: Boolean }
  ],

  aliases: ['i'],

  run: function(environment, options) {
    var cwd     = process.cwd();
    var rawName = path.basename(cwd);
    var ui      = environment.ui;

    if (rawName === 'test') {
      ui.write('Due to an issue with `compileES6` an application name of `test` cannot be used.');
      throw undefined;
    }

    var installBlueprint = environment.tasks.installBlueprint;
    var npmInstall       = environment.tasks.npmInstall;
    var bowerInstall     = environment.tasks.bowerInstall;

    return installBlueprint.run(environment, { dryRun: options.dryRun })
      .then(function() {
        if (!options.dryRun) {
          return npmInstall.run(environment, { verbose: options.verbose });
        }
      })
      .then(function() {
        if (!options.dryRun) {
          return bowerInstall.run(environment, { verbose: options.verbose });
        }
      });
  },

  usageInstructions: function() {
    return 'ember init ' + chalk.yellow('<app-name>');
  }
});
