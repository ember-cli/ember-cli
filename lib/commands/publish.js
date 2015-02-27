'use strict';

var Command = require('../models/command');

module.exports = Command.extend({
  name: 'publish',
  description: 'Publishes your ember-cli addon to npm.',
  works: 'insideProject',

  anonymousOptions: [],

  run: function(commandOptions, rawArgs) {
    var NpmPublishTask = this.tasks.NpmPublish;
    var npmPublish     = new NpmPublishTask({
      ui:         this.ui,
      analytics:  this.analytics,
      project:    this.project
    });

    return npmPublish.run({
      'save-dev': true,
      'save-exact': true
    });
  }
});
