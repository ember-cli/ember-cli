'use strict';

var Command         = require('../models/command');
var checkForUpdates = require('../utilities/check-for-updates');
var emberCLIVersion = require('../utilities/ember-cli-version');
var chalk           = require('chalk');

module.exports = Command.extend({
  name: 'update',
  description: 'Updates ember-cli to the newest available version.',
  works: 'everywhere',

  run: function(commandOptions) {
    return checkForUpdates(this.ui, this.environment)
      .then(function(updateInfo) {
        if (updateInfo.updateNeeded) {
          var UpdateTask = this.tasks.Update;
          var updateTask = new UpdateTask({
            ui: this.ui,
            analytics: this.analytics,
            commands: this.commands,
            tasks: this.tasks,
            project: this.project
          });
          return updateTask.run(commandOptions, updateInfo);
        } else {
          return this.ui.write(
            chalk.green('✓ You have the latest version of ember-cli (' +
              emberCLIVersion() + ').\n'));
        }
      }.bind(this));
  }

});
