'use strict';

var chalk = require('chalk');

module.exports = {
  works: 'outsideProject',
  options: [
    { name: 'dry-run', type: Boolean },
    { name: 'verbose', type: Boolean }
  ],

  run: function(environment, options) {
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
