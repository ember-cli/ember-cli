var fs         = require('fs');
var path       = require('path');
var Blueprint  = require('../../lib/models/blueprint');

module.exports = Blueprint.extend({
  locals: function(options) {
    var baseClass       = 'DS.RESTAdapter';
    var importStatement = 'import DS from \'ember-data\';';

    var applicationAdapterPath = path.resolve(options.target, 'app/adapters/application.js');

    if (fs.existsSync(applicationAdapterPath)) {
      importStatement =  'import ApplicationAdapter from \'./application\';',
      baseClass = 'ApplicationAdapter';
    }

    return {
      importStatement: importStatement,
      baseClass: baseClass
    };
  }
});
