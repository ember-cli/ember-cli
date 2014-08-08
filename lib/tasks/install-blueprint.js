'use strict';

var Blueprint   = require('../models/blueprint');
var Task        = require('../models/task');

module.exports = Task.extend({
  run: function(options) {
    var cwd           = process.cwd();
    var name          = options.rawName;
    var blueprintName = options.blueprint || 'app';
    var path          = require('path');
    // If we're in a dry run, pretend we changed directories.
    // Pretending we cd'd avoids prompts in the actual current directory.
    var fakeCwd       = path.join(process.cwd(), name);
    var target        = options.dryRun ? fakeCwd : cwd;

    var blueprint = Blueprint.lookup(blueprintName);

    var installOptions = {
      target: target,
      entity: { name: name },
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      dryRun: options.dryRun
    };

    return blueprint.install(installOptions);
  }
});
