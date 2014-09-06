var Blueprint = require('../../lib/models/blueprint');

module.exports = Blueprint.extend({
  locals: function(options) {
    return {
      path: '/' + options.entity.name.replace(/^\//, '')
    };
  },
  afterInstall: function() {
    return this.addPackageToProject('connect-restreamer', '^1.0.0');
  }
});
