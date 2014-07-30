var Blueprint = require('../../lib/models/blueprint');

module.exports = Blueprint.extend({
  locals: function(options) {
    var proxyUrl = options.args[2];
    return {
      path: '/' + options.entity.name.replace(/^\//, ''),
      proxyUrl: proxyUrl
    };
  }
});
