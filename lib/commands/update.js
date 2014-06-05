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
    var _this = this;
    return checkForUpdates(this.ui, this.environment)
      .then(function(updateInfo) {
        if (updateInfo.updateNeeded) {
          var UpdateTask = _this.tasks.Update;
          var updateTask = new UpdateTask({
            ui: _this.ui,
            analytics: _this.analytics,
            commands: _this.commands,
            tasks: _this.tasks,
            project: _this.project
          });
          return updateTask.run(commandOptions, updateInfo);
        } else {
          return _this.ui.write(chalk.green('✓ You have the latest version of ember-cli (' + emberCLIVersion() + ').\n'));
        }
      });
  }

});
