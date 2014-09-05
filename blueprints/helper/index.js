var Blueprint = require('../../lib/models/blueprint');

module.exports = Blueprint.extend({
  fileMapTokens: function() {
    return {
      __name__: function(options) {
        return options.dasherizedModuleName;
      }
    };
  }
});
