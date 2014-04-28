var Blueprint = require('../../lib/models/blueprint');

module.exports = Blueprint.extend({
  locals: function(options) {
    var type = options.entity.options.type;

    return {
      baseClass: type === 'array'  ? 'ArrayController' :
                 type === 'object' ? 'ObjectController' :
                                     'Controller'
    };
  }
});
