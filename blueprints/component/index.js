var Blueprint   = require('../../lib/models/blueprint');
var SilentError = require('../../lib/errors/silent');
var path        = require('path');

module.exports = {
  description: 'Generates a component. Name must contain a hyphen.',

  fileMapTokens: function() {
    return {
      __path__: function(options) {
        if (options.pod) {
          return path.join(options.podPath, 'components', options.dasherizedModuleName);
        }
        return 'components';
      },
      __templatepath__: function(options) {
        if (options.pod) {
          return path.join(options.podPath, 'components', options.dasherizedModuleName);
        }
        return 'templates/components';
      },
      __templatename__: function(options) {
        if (options.pod) {
          return 'template';
        }
        return options.dasherizedModuleName;
      }
    };
  },

  normalizeEntityName: function(entityName) {
    entityName = Blueprint.prototype.normalizeEntityName.apply(this, arguments);

    if(! /\-/.test(entityName)) {
      throw new SilentError('You specified "' + entityName + '", but in order to prevent ' +
                            'clashes with current or future HTML element names you must have ' +
                            'a hyphen.');
    }

    return entityName;
  }
};
