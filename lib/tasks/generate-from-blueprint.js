/*jshint quotmark: false*/

'use strict';

var Promise      = require('../ext/promise');
var Blueprint    = require('../models/blueprint');
var Task         = require('../models/task');
var parseOptions = require('../utilities/parse-options');
var merge        = require('lodash-node/modern/objects/merge');

module.exports = Task.extend({
  blueprintFunction: 'install',

  run: function(options) {
    var self = this;
    var name = options.args[0];

    var mainBlueprint = this.lookupBlueprint(name, options.ignoreMissingMain);
    var testBlueprint = this.lookupBlueprint(name + '-test', true);

    if (options.ignoreMissingMain && !mainBlueprint) {
      return Promise.resolve();
    }

    var entity = {
      name: options.args[1],
      options: parseOptions(options.args.slice(2))
    };

    var blueprintOptions = {
      target: this.project.root,
      entity: entity,
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      testing: this.testing,
      taskOptions: options
    };

    blueprintOptions = merge(blueprintOptions, options || {});

    return mainBlueprint[this.blueprintFunction](blueprintOptions)
      .then(function() {
        if (!testBlueprint) { return; }

        if (testBlueprint.locals === Blueprint.prototype.locals) {
          testBlueprint.locals = function(options) {
            return mainBlueprint.locals(options);
          };
        }

        var testBlueprintOptions = merge({} , blueprintOptions, { installingTest: true });

        return testBlueprint[self.blueprintFunction](testBlueprintOptions);
      });
  },

  lookupBlueprint: function(name, ignoreMissing) {
    return Blueprint.lookup(name, {
      paths: this.project.blueprintLookupPaths(),
      ignoreMissing: ignoreMissing
    });
  }
});
