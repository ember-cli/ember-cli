var Blueprint = require('../../lib/models/blueprint');
var SilentError = require('../../lib/errors/silent');

module.exports = Blueprint.extend({
  normalizeEntityName: function(entityName) {
    entityName = Blueprint.prototype.normalizeEntityName.apply(this, arguments);

    if(! /\-/.test(entityName)) {
      throw new SilentError('You specified "' + entityName + '", but in order to prevent ' +
                            'clashes with current or future HTML element names you must have ' +
                            'a hyphen.');
    }

    if(/\//.test(entityName)) {
      throw new SilentError('You specified "' + entityName + '", but due to a bug in ' +
                            'Handlebars (< 2.0) slashes within components/helpers are not ' +
                            'allowed.');
    }

    return entityName;
  }
});
