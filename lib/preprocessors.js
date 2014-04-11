'use strict';

var pkg = require(process.cwd() + '/package');
var deps = pkg['devDependencies'];
var path = require('path');
var Registry = require('./preprocessors/registry');
var requireLocal = require('./utilities/require-local');

var registry = new Registry(deps);

registry.add('css', 'broccoli-sass', 'scss');
registry.add('css', 'broccoli-ruby-sass', 'scss');
registry.add('css', 'broccoli-less-single', 'less');
registry.add('css', 'broccoli-stylus-single', 'styl');

registry.add('js', 'broccoli-coffee', 'coffee');
registry.add('js', 'broccoli-sweetjs', 'js');

registry.add('template', 'broccoli-template', ['hbs', 'handlebars']);
registry.add('template', 'broccoli-emblem-compiler', ['embl', 'emblem']);

module.exports.registerPlugin = registry.add.bind(registry);

module.exports.preprocessCss = function(trees, inputPath, outputPath, options) {
  var plugin = registry.load('css');

  if (!plugin) {
    var compiler = requireLocal('broccoli-static-compiler');
    return compiler(trees, {
      srcDir: inputPath,
      destDir: outputPath
    });
  }

  var input = path.join(inputPath, 'app.' + plugin.ext);
  var output = path.join(outputPath, 'app.css');
  return requireLocal(plugin.name).call(null, trees, input, output, options);
};

module.exports.preprocessTemplates = function(tree) {
  var plugin = registry.load('template');

  return requireLocal(plugin.name).call(null, tree, {
    extensions: plugin.ext,
    compileFunction: 'Ember.Handlebars.compile'
  });
};

module.exports.preprocessJs = function(tree, inputPath, outputPath, options) {
  var plugin = registry.load('js');

  if (!plugin) { return tree; }

  if (plugin.name.indexOf('coffee') !== -1) {
    options = options || {};
    options.bare = true;
    options.srcDir = inputPath;
    options.destDir = outputPath;
  }

  return requireLocal(plugin.name).call(null, tree, options);
};
