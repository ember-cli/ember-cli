'use strict';

var path    = require('path');
var Command = require('../models/command');

module.exports = Command.extend({
  availableOptions: [
    { name: 'environment', type: String, default: 'development' },
    { name: 'output-path', type: path, default: 'dist/' }
  ],
  name: 'build',

  run: function(commandOptions) {
    var BuildTask = this.tasks.Build;
    var buildTask = new BuildTask({
      ui: this.ui,
      analytics: this.analytics
    });
    return buildTask.run(commandOptions);
  }
});
