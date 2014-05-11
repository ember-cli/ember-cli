'use strict';

var Command = require('../models/command');

module.exports = Command.extend({
  name: 'run',
  aliases: ['r'],
  description: 'Run a task using a task runner.',

  run: function(options, rawArgs) {
    options.tasks = rawArgs;

    var RunTasks = this.tasks.RunTasks;
    var tasks = new RunTasks({
      ui: this.ui,
      analytics: this.analytics
    });

    return tasks.run(options);
  },

  usageInstructions: function() {
    return {
      anonymousOptions: '[task options]'
    };
  }
});
