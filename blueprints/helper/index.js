'use strict';
/*jshint node:true*/
var chalk = require('chalk');
var Blueprint   = require('../../lib/models/blueprint');

module.exports = {
  description: 'Generates a helper function.',
  normalizeEntityName: function(entityName) {
    entityName = Blueprint.prototype.normalizeEntityName.apply(this, arguments);

    if (entityName.indexOf('-') === -1) {
      this.ui.write(chalk.yellow('[WARN]: helpers without a dash will not automatically be resolved \n'));
    }
    return entityName;
  }
};
