/*jshint node:true*/

var path = require('path');

module.exports = {
  description: 'Generates a component unit test.',

  locals: function(options) {
    var friendlyDescription = 'Unit | Components | ' + options.entity.name;
    return {
      friendlyDescription: friendlyDescription
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
