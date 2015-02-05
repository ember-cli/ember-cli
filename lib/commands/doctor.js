'use strict';
var Command = require('../models/command');

module.exports = Command.extend({
  name: 'doctor',
  aliases: ['doc'],
  description: 'Performs diagnostics on ember-cli projects.',
  works: 'insideProject',
  availableOptions: [
    {name: 'skip', type: String}
  ],
  anonymousOptions: ['<skipped-checks...>'],

  run: function(commandOptions) {
    var DoctorTask = this.tasks.Doctor;
    var options = {};
    var skippedChecks;

    var doctor = new DoctorTask({
      ui:         this.ui,
      analytics:  this.analytics,
      project:    this.project
    });

    if (commandOptions.skip) {
      // Format skipped items
      skippedChecks = commandOptions.skip.replace(/[\s\n\r]+/g, ',');
      skippedChecks = skippedChecks.split(',');

      skippedChecks = skippedChecks.filter(function(check) {
        return check !== '';
      });
      options.skip = skippedChecks;
    }

    return doctor.run(options);
  }
});