var inflection  = require('inflection');
var stringUtils = require('../../lib/utilities/string');
var EOL         = require('os').EOL;
var chalk       = require('chalk');

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
  },

  printDetailedHelp: function() {
    // TODO: update this with a proper help for the model blueprint
    var output = '';
    var indent = '        ';
    output += indent + chalk.grey('You may generate models with as many attrs as you would like to pass.');
    output += chalk.grey(' The following attribute types are supported:') + EOL;
    output += indent + '  ' + chalk.yellow('<attr-name>') + EOL;
    output += indent + '  ' + chalk.yellow('<attr-name>:array') + EOL;
    output += indent + '  ' + chalk.yellow('<attr-name>:boolean') + EOL;
    output += indent + '  ' + chalk.yellow('<attr-name>:date') + EOL;
    output += indent + '  ' + chalk.yellow('<attr-name>:object') + EOL;
    output += indent + '  ' + chalk.yellow('<attr-name>:number') + EOL;
    output += indent + '  ' + chalk.yellow('<attr-name>:string') + EOL;
    output += indent + '  ' + chalk.yellow('<attr-name>:belongs-to:<model-name>') + EOL;
    output += indent + '  ' + chalk.yellow('<attr-name>:has-many:<model-name>') + EOL + EOL;
    output += indent + chalk.grey('For instance: ');
    output += chalk.green('`ember generate model taco filling:belongs-to:protein toppings:has-many:toppings name:string price:number misc`') + EOL;
    output += indent + chalk.grey('would result in the following model:') + EOL + EOL;
    output += indent + 'import DS from \'ember-data\';' + EOL;
    output += indent + 'export default DS.Model.extend({' + EOL;
    output += indent + '  filling: DS.belongsTo(\'protein\'),' + EOL;
    output += indent + '  toppings: DS.hasMany(\'topping\')' + EOL;
    output += indent + '  name: DS.attr(\'string\'),' + EOL;
    output += indent + '  price: DS.attr(\'number\')' + EOL;
    output += indent + '  misc: DS.attr()' + EOL;
    output += indent + '});' + EOL;
    return output;
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
