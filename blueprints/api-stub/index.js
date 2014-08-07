var Blueprint = require('../../lib/models/blueprint');
var inflection = require('inflection');

module.exports = Blueprint.extend({
  locals: function(options) {
    return {
      path: '/' + inflection.pluralize(options.entity.name.replace(/^\//, ''))
    };
  }
});
