var Blueprint = require('../../lib/models/blueprint');

module.exports = Blueprint.extend({
  normalizeEntityName: function(entityName) {
    entityName = Blueprint.prototype.normalizeEntityName.apply(this, arguments);

    if(! /\-/.test(entityName)) {
      throw new Error('You specified "' + entityName + '", but in order to prevent ' +
                      'clashes with current or future HTML element names you must have ' +
                      'a hyphen.\n');
    }

    if(/\//.test(entityName)) {
      throw new Error('You specified "' + entityName + '", but due to a bug in ' +
                      'Handlebars (< 2.0) slashes within components/helpers are not ' +
                      'allowed.\n');
    }

    return entityName;
  }
});
