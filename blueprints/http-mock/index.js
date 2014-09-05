var Blueprint = require('../../lib/models/blueprint');

module.exports = Blueprint.extend({
  fileMapTokens: function() {
    return {
      __name__: function(options) {
        return options.dasherizedModuleName;
      }
    };
  },
  locals: function(options) {
    return {
      path: '/' + options.entity.name.replace(/^\//, '')
    };
  },
  afterInstall: function() {
    return this.addPackageToProject('connect-restreamer', '^1.0.0');
  }
});
