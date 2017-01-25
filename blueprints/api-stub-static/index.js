var Blueprint = require('../../lib/models/blueprint');

module.exports = Blueprint.extend({
  locals: function(options) {
    return {
      path: '/' + options.entity.name.replace(/^\//, '')
    };
  }
});
