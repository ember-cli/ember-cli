var Blueprint  = require('../../lib/models/blueprint');
var Promise    = require('../../lib/ext/promise');
var merge      = require('lodash-node/compat/objects/merge');
var inflection = require('inflection');

module.exports = Blueprint.extend({
  install: function(options) {
    var modelOptions = merge({}, options, {
      entity: {
        name: inflection.singularize(options.entity.name)
      }
    });
    var routeOptions = merge({}, options, { type: 'resource' });

    return Promise.all([
      this._installBlueprint('model', modelOptions),
      this._installBlueprint('route', routeOptions)
    ]);
  },

  _installBlueprint: function(name, options) {
    var blueprint = Blueprint.lookup(name, {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });

    return blueprint.install(options);
  },

  uninstall: function(options) {
    var modelOptions = merge({}, options, {
      entity: {
        name: inflection.singularize(options.entity.name)
      }
    });
    var routeOptions = merge({}, options, { type: 'resource' });

    return Promise.all([
      this._uninstallBlueprint('model', modelOptions),
      this._uninstallBlueprint('route', routeOptions)
    ]);
  },

  _uninstallBlueprint: function(name, options) {
    var blueprint = Blueprint.lookup(name, {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });

    return blueprint.uninstall(options);
  }
});
