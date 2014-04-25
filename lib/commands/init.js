'use strict';

var path    = require('path');
var Command = require('../command');

module.exports = new Command({
  description: 'Creates a new ember-cli project in the current folder.',
  works: 'everywhere',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false },
    { name: 'verbose', type: Boolean, default: false }
  ],

  aliases: ['i'],

  run: function(environment, options) {
    var cwd     = process.cwd();
    var rawName = path.basename(cwd);

    if (rawName === 'test') {
      this.ui.write('Due to an issue with `compileES6` an application name of `test` cannot be used.');
      throw undefined;
    }

    var installBlueprint = environment.tasks.installBlueprint;
    var npmInstall       = environment.tasks.npmInstall;
    var bowerInstall     = environment.tasks.bowerInstall;
    var self             = this;

    return installBlueprint.run(this.ui, { dryRun: options.dryRun })
      .then(function() {
        console.log('ZOMG', 'npm install');
        console.log('first');
        if (!options.dryRun) {
          return npmInstall.run(self.ui, { verbose: options.verbose });
        }
      })
      .then(function() {
        console.log('ZOMG', 'bower install');
        if (!options.dryRun) {
          return bowerInstall.run(self.ui, { verbose: options.verbose });
        }
      });
  },

  usageInstructions: function() {
    return {
      anonymousOptions: '<app-name>'
    };
  }
});
