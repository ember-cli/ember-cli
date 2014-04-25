'use strict';

var chalk   = require('chalk');
var Command = require('../command');

module.exports = new Command({
  description: 'Creates a new folder and runs ' + chalk.green('ember init') + ' in it.',

  works: 'outsideProject',

  availableOptions: [
    { name: 'verbose', type: Boolean, default: false }
  ],

  run: function(environment, options) {
    var rawName = environment.cliArgs[1];

    if (!rawName) {
      this.ui.write(chalk.yellow('The `ember new` command requires an ' +
               'app-name to be specified. For more details, use `ember help`.\n'));

      throw undefined;
    }

    if (rawName === 'test') {
      this.ui.write('Due to an issue with `compileES6` an application name of `test` cannot be used.');

      throw undefined;
    }

    var createAndStepIntoDirectory  = environment.tasks.createAndStepIntoDirectory;
    var init                        = environment.commands.init;

    createAndStepIntoDirectory.ui   = this.ui;
    createAndStepIntoDirectory.leek = this.leek;
    init.ui                         = this.ui;
    init.leek                       = this.leek;

    return createAndStepIntoDirectory
      .run({ directoryName: rawName })
      .then(function() {
        init.run(environment, options);
      });
  },

  usageInstructions: function() {
    return {
      anonymousOptions: '<app-name>'
    };
  }
});
