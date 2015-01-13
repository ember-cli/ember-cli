var path = require('path');

module.exports = {
  description: 'Generates a component unit test.',
  fileMapTokens: function() {
    return {
      __path__: function(options) {
        if (options.pod) {
          return path.join(options.podPath, 'components', options.dasherizedModuleName);
        }
        return 'components';
      }
    }
  }
};
