var Blueprint   = require('../../lib/models/blueprint');
var inflection  = require('inflection');
var stringUtils = require('../../lib/utilities/string');

module.exports = Blueprint.extend({
  locals: function(options) {
    var attrs = [];
    var needs = [];
    var entityOptions = options.entity.options;

    for (var name in entityOptions) {
      var type = entityOptions[name];
      var dasherizedName = stringUtils.dasherize(name);
      var dasherizedNameSingular = inflection.singularize(dasherizedName);
      var camelizedName = stringUtils.camelize(name);
      var dasherizedType = stringUtils.dasherize(type);

      attrs.push(camelizedName + ': ' + dsAttr(camelizedName, dasherizedType));

      if (/has-many|belongs-to/.test(type)) {
        needs.push("'model:" + dasherizedNameSingular + "'");
      }
    }

    attrs = attrs.join(',\n  ');
    needs = '  needs: [' + needs.join(', ') + ']';

    return {
      attrs: attrs,
      needs: needs
    };
  }
});

function dsAttr(name, type) {
  switch (type) {
  case 'array':
  case 'boolean':
  case 'date':
  case 'number':
  case 'object':
  case 'string':
    return 'DS.attr(\'' + type + '\')';
  case 'belongs-to':
    return 'DS.belongsTo(\'' + name + '\')';
  case 'has-many':
    var singularizedName = inflection.singularize(name);
    return 'DS.hasMany(\'' + singularizedName + '\')';
  }
}
