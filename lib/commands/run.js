'use strict';

var Command = require('../models/command');

module.exports = Command.extend({
  name: 'run',
  aliases: ['r', 'grunt'],
  description: 'Run a grunt task.',

  run: function(options, rawArgs) {
    options.tasks = rawArgs;

    var RunGruntTasks = this.tasks.RunGruntTasks;
    var gruntTasks = new RunGruntTasks({
      ui: this.ui,
      analytics: this.analytics
    });

    return gruntTasks.run(options);
  },

  usageInstructions: function() {
    return {
      anonymousOptions: '<grunt-task-name-1> <grunt-task-name-2> ...'
    };
  }
});
