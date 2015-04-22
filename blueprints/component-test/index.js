/*jshint node:true*/

var path = require('path');
var testInfo = require('../../lib/utilities/test-info');

module.exports = {
  description: 'Generates a component unit test.',

  locals: function(options) {
    return {
      friendlyTestDescription: testInfo.description(options.entity.name, "Unit", "Component")
    };
  },

  fileMapTokens: function() {
    return {
      __path__: function(options) {
        if (options.pod) {
          return path.join(options.podPath, 'components', options.dasherizedModuleName);
        }
        return 'components';
      }
    };
  }
};
