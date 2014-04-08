'use strict';

var chalk = require('chalk');
var path  = require('path');

module.exports = {
  works: 'everywhere',
  options: [
    { name: 'dry-run', type: Boolean },
    { name: 'verbose', type: Boolean }
  ],

  run: function(environment, options) {
    var cwd     = process.cwd();
    var rawName = path.basename(cwd);
    var ui      = environment.ui;

    if (rawName === 'test') {
      ui.write('Due to an issue with `compileES6` an application name of `test` cannot be used.');
      throw undefined;
    }

    var installBlueprint = environment.tasks.installBlueprint.run;
    var npmInstall       = environment.tasks.npmInstall.run;
    var bowerInstall     = environment.tasks.bowerInstall.run;


    return installBlueprint(environment, { dryRun: options.dryRun })
      .then(function() {
        if (!options.dryRun) {
          return npmInstall(environment, { verbose: options.verbose });
        }
      })
      .then(function() {
        if (!options.dryRun) {
          return bowerInstall(environment, { verbose: options.verbose });
        }
      });
  },

  usageInstructions: function() {
    return 'ember init ' + chalk.yellow('<app-name>');
  }
};
