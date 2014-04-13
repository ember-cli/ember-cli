'use strict';

var chalk   = require('chalk');
var Command = require('../command');

module.exports = new Command({
  works: 'outsideProject',

  availableOptions: [
    { name: 'verbose', type: Boolean }
  ],

  run: function(ui, environment, options) {
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
      .then(init.run.bind(null, ui, environment, options));
  },

  usageInstructions: function() {
    return 'ember new ' + chalk.yellow('<app-name>');
  }
});
