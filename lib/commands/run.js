'use strict';

var Command = require('../models/command');

module.exports = Command.extend({
  name: 'run',
  aliases: ['r'],
  description: 'Run tasks using a task runner.',

  run: function(options, rawArgs) {
    options.tasks = rawArgs;

    var RunTasks = this.tasks.RunTasks;
    var tasks = new RunTasks({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });

    return tasks.run(options);
  },

  usageInstructions: function() {
    return {
      anonymousOptions: '<task 1> <task 2>...'
    };
  }
});
