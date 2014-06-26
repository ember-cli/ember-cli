'use strict';

var Blueprint   = require('../models/blueprint');
var Task        = require('../models/task');

module.exports = Task.extend({
  run: function(options) {
    var cwd           = process.cwd();
    var name          = options.rawName;
    var blueprintName = options.blueprint || 'app';

    var blueprint = Blueprint.lookup(blueprintName);

    var installOptions = {
      target: cwd,
      entity: { name: name },
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      dryRun: options.dryRun
    };

    return blueprint.install(installOptions);
  }
});
