'use strict';

var Blueprint   = require('../models/blueprint');
var Task        = require('../models/task');

module.exports = Task.extend({
  run: function(options) {
    var cwd           = process.cwd();
    var name          = options.rawName;
    var blueprintName = options.blueprint || 'app';

    var blueprint = Blueprint.lookup(blueprintName, {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });

    var installOptions = {
      target: cwd,
      dryRun: options.dryRun,
      entity: {
        name: name
      }
    };

    return blueprint.install(installOptions);
  }
});
