var inflection  = require('inflection');
var stringUtils = require('../../lib/utilities/string');
var EOL         = require('os').EOL;

module.exports = {
  description: 'Generates an ember-data model.',

  anonymousOptions: [
    'name',
    'attr:type'
  ],

  locals: function(options) {
    var attrs = [];
    var needs = [];
    var entityOptions = options.entity.options;

    for (var name in entityOptions) {
      var type = entityOptions[name] || '';
      var dasherizedName = stringUtils.dasherize(name);
      var dasherizedNameSingular = inflection.singularize(dasherizedName);
      var camelizedName = stringUtils.camelize(name);
      var dasherizedType = stringUtils.dasherize(type);

      if (/has-many/.test(dasherizedType)) {
        var camelizedNamePlural = inflection.pluralize(camelizedName);
        attrs.push(camelizedNamePlural + ': ' + dsAttr(dasherizedName, dasherizedType));
      } else {
        attrs.push(camelizedName + ': ' + dsAttr(dasherizedName, dasherizedType));
      }

      if (/has-many|belongs-to/.test(dasherizedType)) {
        needs.push("'model:" + dasherizedNameSingular + "'");
      }
    }

    attrs = attrs.join(',' + EOL + '  ');
    needs = '  needs: [' + needs.join(', ') + ']';

    return {
      attrs: attrs,
      needs: needs
    };
  }
};

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
  default:
    //"If you don't specify the type of the attribute, it will be whatever was provided by the server"
    //http://emberjs.com/guides/models/defining-models/
    return 'DS.attr()';
  }
}
