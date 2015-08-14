'use strict';
/*jshint node:true*/
var Blueprint   = require('../../lib/models/blueprint');

module.exports = {
  description: 'Generates a helper function.',
  normalizeEntityName: function(entityName) {
    entityName = Blueprint.prototype.normalizeEntityName.apply(this, arguments);

    return entityName;
  }
};
