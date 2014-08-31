var fs         = require('fs');
var path       = require('path');
var stringUtil = require('../../lib/utilities/string');
var Blueprint  = require('../../lib/models/blueprint');

module.exports = Blueprint.extend({
  locals: function(options) {
    var baseClass       = 'DS.RESTAdapter';
    var importStatement = 'import DS from \'ember-data\';';

    if (options.baseClass) {
      baseClass = stringUtil.classify(options.baseClass.replace('\/', '-'));
      baseClass = baseClass + 'Adapter';

      importStatement = 'import ' + baseClass + ' from \'./' + options.baseClass + '\';'
    } else {
      var applicationAdapterPath = path.resolve(options.target, 'app/adapters/application.js');

      if (fs.existsSync(applicationAdapterPath)) {
        importStatement =  'import ApplicationAdapter from \'./application\';',
        baseClass = 'ApplicationAdapter';
      }
    }

    return {
      importStatement: importStatement,
      baseClass: baseClass
    };
  }
});
