'use strict';

var chalk        = require('chalk');
var Command      = require('../command');
var path         = require('path');
var Blueprint    = require('../blueprint');
var NULL_PROJECT = require('../models/project').NULL_PROJECT;

module.exports = new Command({
  description: 'Creates a new folder and runs ' + chalk.green('ember init') + ' in it.',

  works: 'outsideProject',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false },
    { name: 'verbose', type: Boolean, default: false },
    { name: 'blueprint', type: path, default: Blueprint.main }
  ],

  run: function(environment, options) {
    var rawName = environment.cliArgs[1];
    var ui      = this.ui;

    if (!rawName) {
      ui.write(chalk.yellow('The `ember new` command requires an ' +
               'app-name to be specified. For more details, use `ember help`.\n'));

      throw undefined;
    }

    if (rawName === 'test') {
      ui.write('Due to an issue with `compileES6` an application name of `test` cannot be used.');

      throw undefined;
    }

    var createAndStepIntoDirectory  = environment.tasks.createAndStepIntoDirectory;
    var init                        = environment.commands.init;

    environment.project = NULL_PROJECT;

    createAndStepIntoDirectory.ui   = this.ui;
    createAndStepIntoDirectory.leek = this.leek;
    init.ui                         = this.ui;
    init.leek                       = this.leek;

    return createAndStepIntoDirectory
      .run({ directoryName: rawName })
      .then(init.run.bind(null, environment, options));
  },

  usageInstructions: function() {
    return {
      anonymousOptions: '<app-name>'
    };
  }
});
