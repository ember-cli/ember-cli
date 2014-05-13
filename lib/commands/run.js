'use strict';

var Command = require('../models/command');

module.exports = Command.extend({
  name: 'run',
  aliases: ['r'],
  description: 'Run tasks using a task runner.',

  run: function(options, rawArgs) {
    options.tasks = rawArgs;

    var RunScript = this.tasks.RunScript;
    var script = new RunScript({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });

    return script.run(options);
  },

  usageInstructions: function() {
    return {
      anonymousOptions: '<task args>...'
    };
  }
});
