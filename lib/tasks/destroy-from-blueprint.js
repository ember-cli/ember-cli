/*jshint quotmark: false*/

'use strict';

var Blueprint    = require('../models/blueprint');
var Task         = require('../models/task');
var parseOptions = require('../utilities/parse-options');
var merge        = require('lodash-node/modern/objects/merge');

module.exports = Task.extend({
  run: function(options) {
    var blueprint = Blueprint.lookup(options.args[0], {
      paths: this.project.blueprintLookupPaths()
    });

    var entity = {
      name: options.args[1],
      options: parseOptions(options.args.slice(2))
    };

    var uninstallOptions = {
      target: this.project.root,
      entity: entity,
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    };

    uninstallOptions = merge(uninstallOptions, options || {});

    return blueprint.uninstall(uninstallOptions);
  }
});
