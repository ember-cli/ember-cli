const path = require('path');

module.exports = {

  filesPath: function() {
    return path.join(this.path, 'files');
  },

  fileMapTokens: function() {
    return {
      __path__: function(options) {
        return path.join('components', 'new-path');
      },
    };
  },

  locals(options) {
    return {
      importTemplate: '',
      contents: '',
      path: ''
    };
  }
};
