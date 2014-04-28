/*jshint quotmark: false*/

'use strict';

var Blueprint    = require('../models/blueprint');
var Task         = require('../models/task');
var parseOptions = require('../utilities/parse-options');

module.exports = Task.extend({
  run: function(options) {
    var blueprint = Blueprint.lookup(options.args[0], {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });

    var installOptions = {
      entity: {
        name: options.args[1],
        options: parseOptions(options.args.slice(2))
      },
      target: process.cwd(),
      dryRun: options.dryRun,
      verbose: options.verbose
    };

    return blueprint.install(installOptions);
  }
});
