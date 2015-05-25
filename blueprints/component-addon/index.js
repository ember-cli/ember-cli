/*jshint node:true*/

var Blueprint          = require('../../lib/models/blueprint');
var stringUtil         = require('../../lib/utilities/string');
var validComponentName = require('../../lib/utilities/valid-component-name');
var path               = require('path');

module.exports = {
  description: 'Generates a component. Name must contain a hyphen.',

  fileMapTokens: function() {
    return {
      __path__: function(options) {
        if (options.pod) {
          return path.join(options.podPath, options.locals.path, options.dasherizedModuleName);
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

    return validComponentName(entityName);
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
      modulePath: pathName,
      path: options.path
    };
  }
};
