var Blueprint = require('../../lib/models/blueprint');
var Promise   = require('../../lib/ext/promise');

module.exports = Blueprint.extend({
  locals: function(options) {
    var proxyUrl = options.args[2];
    return {
      path: '/' + options.entity.name.replace(/^\//, ''),
      proxyUrl: proxyUrl
    };
  },

  afterInstall: function() {
    return Promise.all([
      this.addPackageToProject('http-proxy', '^1.1.6'),
      this.addPackageToProject('connect-restreamer', '^1.0.0')
    ]);
  }
});
