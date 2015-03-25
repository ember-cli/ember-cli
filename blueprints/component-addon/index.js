var Blueprint   = require('../../lib/models/blueprint');
var SilentError = require('../../lib/errors/silent');
var stringUtil  = require('../../lib/utilities/string');
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
      __name__: function(options) {
        if (options.pod) {
          return 'component';
        }
        return options.dasherizedModuleName;
      },
      __root__: function(options) {
        if (options.inRepoAddon) {
          return path.join('lib', options.inRepoAddon, 'app');
        }
        return 'app';
      }
    };
  },

  normalizeEntityName: function(entityName) {
    entityName = Blueprint.prototype.normalizeEntityName.apply(this, arguments);

    if(! /\-/.test(entityName)) {
      throw new SilentError('You specified "' + entityName + '", but in order to prevent ' +
                            'clashes with current or future HTML element names, you must include ' +
                            'a hyphen in the component name.');
    }

    return entityName;
  },

  locals: function(options) {
    var addonRawName   = options.inRepoAddon ? options.inRepoAddon : options.project.pkg.name;
    var addonName      = stringUtil.dasherize(addonRawName);
    var fileName       = stringUtil.dasherize(options.entity.name);
    var pathName       = [addonName, 'components', fileName].join('/');

    if (options.pod) {
      pathName = [addonName, 'components', fileName,'component'].join('/');
    }

    return {
      modulePath: pathName
    };
  }
};
