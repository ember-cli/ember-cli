'use strict';

var pkg          = require(process.cwd() + '/package');
var deps         = pkg['devDependencies'];
var path         = require('path');
var Registry     = require('./preprocessors/registry');
var requireLocal = require('./utilities/require-local');

var registry = new Registry(deps);

registry.add('css', 'broccoli-sass', 'scss');
registry.add('css', 'broccoli-ruby-sass', 'scss');
registry.add('css', 'broccoli-less-single', 'less');
registry.add('css', 'broccoli-stylus-single', 'styl');

registry.add('js', 'broccoli-coffee', 'coffee');
registry.add('js', 'broccoli-ember-script', 'em');
registry.add('js', 'broccoli-sweetjs', 'js');

registry.add('template', 'broccoli-ember-hbs-template-compiler', ['hbs', 'handlebars']);
registry.add('template', 'broccoli-emblem-compiler', ['embl', 'emblem']);

module.exports.registerPlugin = registry.add.bind(registry);

module.exports.isType = function(file, type) {
  var plugins   = registry.registry[type] || [];
  var extension = path.extname(file).replace('.', '');

  for (var i = 0; i < plugins.length; i++) {
    if (extension === plugins[i].ext) {
      return true;
    }
  }
};

module.exports.preprocessCss = function(tree, inputPath, outputPath, options) {
  var plugin = registry.load('css');

  if (!plugin) {
    var compiler = require('broccoli-static-compiler');
    return compiler(tree, {
      srcDir: inputPath,
      destDir: outputPath
    });
  }

  var input = path.join(inputPath, 'app.' + plugin.ext);
  var output = path.join(outputPath, 'app.css');
  return requireLocal(plugin.name).call(null, [tree], input, output, options);
};

module.exports.preprocessTemplates = function(tree) {
  var plugin = registry.load('template');

  if (!plugin) {
    throw new Error('Missing template processor');
  }

  return requireLocal(plugin.name).call(null, tree, {
    extensions: plugin.ext,
    module: true
  });
};

module.exports.preprocessJs = function(tree, inputPath, outputPath, options) {
  var plugin = registry.load('js');

  if (!plugin) { return tree; }

  if (plugin.name.indexOf('coffee') !== -1 || plugin.name.indexOf('ember-script') !== -1) {
    options = options || {};
    options.bare = true;
    options.srcDir = inputPath;
    options.destDir = outputPath;
  }

  return requireLocal(plugin.name).call(null, tree, options);
};
