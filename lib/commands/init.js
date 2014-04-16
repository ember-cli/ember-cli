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

  run: function(ui, environment, options) {
    var cwd     = process.cwd();
    var rawName = path.basename(cwd);

    if (rawName === 'test') {
      ui.write('Due to an issue with `compileES6` an application name of `test` cannot be used.');
      throw undefined;
    }

    var installBlueprint = environment.tasks.installBlueprint;
    var npmInstall       = environment.tasks.npmInstall;
    var bowerInstall     = environment.tasks.bowerInstall;

    return installBlueprint.run(ui, {
        dryRun: options.dryRun,
        blueprintDir: path.join(__dirname, '../../blueprint'),
        verbose: options.verbose
      })
      .then(function() {
        if (!options.dryRun) {
          return npmInstall.run(ui, { verbose: options.verbose });
        }
      })
      .then(function() {
        if (!options.dryRun) {
          return bowerInstall.run(ui, { verbose: options.verbose });
        }
      });
  },

  usageInstructions: function() {
    return {
      anonymousOptions: '<app-name>'
    };
  }
});
