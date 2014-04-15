'use strict';

var chalk   = require('chalk');
var Command = require('../command');

module.exports = new Command({
  description: 'Creates a new folder and runs ' + chalk.green('ember init') + ' in it.',

  works: 'outsideProject',

  availableOptions: [
    { name: 'verbose', type: Boolean, default: false }
  ],

  run: function(ui, leek, environment, options) {
    var rawName = environment.cliArgs[1];

    if (!rawName) {
      ui.write(chalk.yellow('The `ember new` command requires an ' +
               'app-name to be specified. For more details, use `ember help`.\n'));

      throw undefined;
    }

    if (rawName === 'test') {
      ui.write('Due to an issue with `compileES6` an application name of `test` cannot be used.');

      throw undefined;
    }

    var createAndStepIntoDirectory = environment.tasks.createAndStepIntoDirectory;
    var init = environment.commands.init;

    return createAndStepIntoDirectory
      .run(ui, { directoryName: rawName })
      .then(function() {
        init.run(ui, leek, environment, options)
      });
  },

  usageInstructions: function() {
    return {
      anonymousOptions: '<app-name>'
    };
  }
});
