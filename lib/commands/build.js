'use strict';

var path    = require('path');
var Command = require('../models/command');

module.exports = Command.extend({
  name: 'build',
  description: 'Builds your app and places it into the output path (dist/ by default).',

  availableOptions: [
    { name: 'environment', type: String, default: 'development' },
    { name: 'output-path', type: path, default: 'dist/' },
    { name: 'watch', type: Boolean, default: false }
  ],

  run: function(commandOptions) {
    var options = {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    };

    var npmValidateTask = new this.tasks.NpmValidate(options);

    return npmValidateTask.run(commandOptions)
      .then(function() {
        var BuildTask = this.taskFor(commandOptions);
        var buildTask = new BuildTask(options);
        return buildTask.run(commandOptions);
      }.bind(this));
  },

  taskFor: function(options) {
    if (options.watch) {
      return this.tasks.BuildWatch;
    } else {
      return this.tasks.Build;
    }
  }
});
