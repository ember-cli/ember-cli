'use strict';

var Command         = require('../models/command');
var UpdateChecker   = require('../models/update-checker');
var versionUtils    = require('../utilities/version-utils');
var emberCLIVersion = versionUtils.emberCLIVersion;
var chalk           = require('chalk');

module.exports = Command.extend({
  name: 'update',
  description: 'Updates ember-cli to the newest available version.',
  works: 'everywhere',
  init: function() {
    this.updateChecker = this.updateChecker || new UpdateChecker(this.ui, this.settings);
  },

  run: function(commandOptions) {
    return this.updateChecker.checkForUpdates()
      .then(function(updateInfo) {
        if (updateInfo.updateNeeded) {

          var updateTask = new this.tasks.Update({
            ui: this.ui,
            analytics: this.analytics,
            commands: this.commands,
            tasks: this.tasks,
            project: this.project,
          });

          return updateTask.run(commandOptions, updateInfo);
        } else {
          this.ui.writeLine(
            chalk.green('✓ You have the latest version of ember-cli (' +
              emberCLIVersion() + ').'));
        }
      }.bind(this));
  }
});
