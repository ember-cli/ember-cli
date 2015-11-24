/*jshint node:true*/

var stringUtil  = require('ember-cli-string-utils');
var path        = require('path');
var inflector   = require('inflection');
var SilentError = require('silent-error');

module.exports = {
  description: 'Generates an import wrapper.',
  beforeInstall: function(options) {
    if(options.originBlueprintName === 'addon-import') {
      throw new SilentError('You cannot call the addon-import blueprint directly.');
    }
  },

  fileMapTokens: function() {
    return {
      __name__: function(options) {
        if (options.pod && options.hasPathToken) {
          return options.locals.blueprintName;
        }
        return options.dasherizedModuleName;
      },
      __path__: function(options) {
        if (options.pod && options.hasPathToken) {
          return path.join(options.podPath, options.dasherizedModuleName);
        }
        return inflector.pluralize(options.locals.blueprintName);
      },
      __root__: function(options) {
        if (options.inRepoAddon) {
          return path.join('lib', options.inRepoAddon, 'app');
        }
        return 'app';
      }
    };
  },
  locals: function(options) {
    var addonRawName   = options.inRepoAddon ? options.inRepoAddon : options.project.name();
    var addonName      = stringUtil.dasherize(addonRawName);
    var fileName       = stringUtil.dasherize(options.entity.name);
    var modulePath     = [addonName, inflector.pluralize(options.originBlueprintName), fileName].join('/');
    var blueprintName  = options.originBlueprintName;
    
    if (blueprintName.match(/-addon/)) {
      blueprintName = blueprintName.substr(0,blueprintName.indexOf('-addon'));
      modulePath = [addonName, inflector.pluralize(blueprintName), fileName].join('/');
    }
    
    if (options.pod) {
      modulePath = [addonName, fileName, blueprintName].join('/');
    }

    return {
      modulePath: modulePath,
      blueprintName: blueprintName
    };
  }
};
