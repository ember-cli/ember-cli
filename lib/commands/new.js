'use strict';

var chalk   = require('chalk');

module.exports = {
  works: 'outsideProject',
  options: [
    { name: 'verbose', type: Boolean }
  ],

  run: function(environment, options) {
    var init = environment.commands.init.run;
    var createAndStepIntoDirectory =
      environment.tasks.createAndStepIntoDirectory.run;
    var ui   = environment.ui;

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

    return createAndStepIntoDirectory(environment, { directoryName: rawName })
      .then(function() { return init(environment, options); });
  },

  usageInstructions: function() {
    return 'ember new ' + chalk.yellow('<app-name>');
  }
};
