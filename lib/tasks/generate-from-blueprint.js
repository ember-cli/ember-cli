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
    var blueprints = [];
    var isBuiltInBlueprint = Blueprint.isBuiltIn(options.args[0]);

    if (isBuiltInBlueprint) {
      blueprints.push({
        name: options.args[0],
        args: options.args,
        options: options
      });
    } else {
      options.args.forEach(function(arg) {
        blueprints.push({
          name: arg,
          options: options
        });
      }, this);
    }

    return this.runBlueprints(blueprints);
  },

  lookupBlueprint: function(name, ignoreMissing) {
    return Blueprint.lookup(name, {
      paths: this.project.blueprintLookupPaths(),
      ignoreMissing: ignoreMissing
    });
  },

  runBlueprints: function(blueprints) {
    return this.runBlueprint(blueprints.shift())
      .then(function() {
        if (blueprints.length > 0) {
          this.runBlueprints(blueprints);
        }
      }.bind(this));
  },

  runBlueprint: function(blueprint) {
    var name = blueprint.name;
    var args = blueprint.args || [];
    var options = blueprint.options || {};

    var mainBlueprint  = this.lookupBlueprint(name, options.ignoreMissingMain);
    var testBlueprint  = this.lookupBlueprint(name + '-test', true);
    var addonBlueprint = this.lookupBlueprint(name + '-addon', true);

    if (options.ignoreMissingMain && !mainBlueprint) {
      return Promise.resolve();
    }

    var entity = {
      name: null,
      options: {}
    };

    if (args.length > 1) {
      entity.name = args[1];
      entity.options = parseOptions(args.slice(2));
    }

    var blueprintOptions = {
      target: this.project.root,
      entity: entity,
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      settings: this.settings,
      testing: this.testing,
      taskOptions: options
    };

    blueprintOptions = merge(blueprintOptions, options);

    return mainBlueprint[this.blueprintFunction](blueprintOptions)
      .then(function() {
        if (!testBlueprint) { return; }

        if (testBlueprint.locals === Blueprint.prototype.locals) {
          testBlueprint.locals = function(options) {
            return mainBlueprint.locals(options);
          };
        }

        var testBlueprintOptions = merge({} , blueprintOptions, { installingTest: true });

        return testBlueprint[this.blueprintFunction](testBlueprintOptions);
      }.bind(this))
      .then(function() {
        if (!addonBlueprint) { return; }
        if (!this.project.isEmberCLIAddon() && blueprintOptions.inRepoAddon === null) { return; }

        if (addonBlueprint.locals === Blueprint.prototype.locals) {
          addonBlueprint.locals = function(options) {
            return mainBlueprint.locals(options);
          };
        }

        var addonBlueprintOptions = merge({}, blueprintOptions, { installingAddon: true });

        return addonBlueprint[this.blueprintFunction](addonBlueprintOptions);
      }.bind(this));
  }
});
