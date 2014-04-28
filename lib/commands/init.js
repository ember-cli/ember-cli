'use strict';

var path      = require('path');
var Command   = require('../command');
var Blueprint = require('../blueprint');

module.exports = new Command({
  description: 'Creates a new ember-cli project in the current folder.',
  works: 'everywhere',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false },
    { name: 'verbose', type: Boolean, default: false },
    { name: 'blueprint', type: path, default: Blueprint.main }
  ],

  aliases: ['i'],

  run: function(environment, options) {
    var cwd     = process.cwd();
    var ui      = this.ui;

    var installBlueprint = environment.tasks.installBlueprint;
    var npmInstall       = environment.tasks.npmInstall;
    var bowerInstall     = environment.tasks.bowerInstall;
    var packageName      = environment.project ? environment.project.pkg.name : path.basename(cwd);
    var blueprintOpts    = {
      dryRun: options.dryRun,
      blueprint: options.blueprint,
      rawName: packageName
    };

    if (packageName === 'test') {
      ui.write('Due to an issue with `compileES6` an application name of `test` cannot be used.');
      throw undefined;
    }

    return installBlueprint.run(ui, blueprintOpts)
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
