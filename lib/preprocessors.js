'use strict';

var pkg = require(process.cwd() + '/package');
var deps = pkg['devDependencies'];

function preprocessorType(preprocessor) {
  var types = Object.keys(preprocessor.supportedPlugins);

  return types.reduce(function(final, type) {
    var plugin = preprocessor.supportedPlugins[type];

    if(deps[plugin]) {
      return type;
    }

    return final;
  }, preprocessor.fallback);
}

var css = require('./preprocessors/css');
var templates = require('./preprocessors/templates');

module.exports.preprocessCss = function(trees, inputPath, outputPath, options) {
  var type = preprocessorType(css);
  return css[type].call(null, trees, inputPath, outputPath, options);
};

module.exports.preprocessTemplates = function(tree) {
  var type = preprocessorType(templates);
  return templates[type].call(null, tree);
};
