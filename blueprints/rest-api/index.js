var Blueprint = require('../../lib/models/blueprint');

module.exports = Blueprint.extend({
  locals: function(options) {
    return {
      modelname: options.entity.name,
      namespace: 'api'
    };
  }
});