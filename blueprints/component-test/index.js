/*jshint node:true*/

var path = require('path');
var testInfo = require('../../lib/utilities/test-info');
var stringUtil  = require('../../lib/utilities/string');

module.exports = {
  description: 'Generates a component unit test.',

  fileMapTokens: function() {
    return {
      __path__: function(options) {
        if (options.pod) {
          return path.join(options.podPath, options.locals.path, options.dasherizedModuleName);
        }
        return 'components';
      }
    };
  },
  locals: function(options) {
    var dasherizedModuleName = stringUtil.dasherize(options.entity.name);
    var componentPathName = dasherizedModuleName;
    if(options.pod && options.path !== 'components' && options.path !== '') {
      componentPathName = [options.path, dasherizedModuleName].join('/');
    }
    return {
      path: options.path,
      componentPathName: componentPathName,
      friendlyTestDescription: testInfo.description(options.entity.name, "Unit", "Component")
    };
  }
};
