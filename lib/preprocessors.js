'use strict';

var path         = require('path');
var Registry     = require('./preprocessors/registry');
var requireLocal = require('./utilities/require-local');

module.exports.setupRegistry = function(app) {
  var registry = new Registry(app.project.dependencies(), app);

  registry.add('css', 'broccoli-sass', ['scss', 'sass']);
  registry.add('css', 'broccoli-ruby-sass', ['scss', 'sass']);
  registry.add('css', 'broccoli-stylus-single', 'styl');

  registry.add('minify-css', 'broccoli-csso', null);

  registry.add('js', 'broccoli-ember-script', 'em');

  registry.add('template', 'broccoli-ember-hbs-template-compiler', ['hbs', 'handlebars']);
  registry.add('template', 'broccoli-emblem-compiler', ['embl', 'emblem']);

  return registry;
};

module.exports.isType = function(file, type, options) {
  var extension = path.extname(file).replace('.', '');

  if (extension === type) { return true; }

  if (options.registry.extensionsForType(type).indexOf(extension) > -1) {
    return true;
  }
};

module.exports.preprocessMinifyCss = function(tree, options) {
  var plugins = options.registry.load('minify-css');

  if (plugins.length === 0) {
    var compiler = require('broccoli-clean-css');
    return compiler(tree, options);
  } else if (plugins.length > 1) {
    throw new Error('You cannot use more than one minify-css plugin at once.');
  }

  var plugin = plugins[0];

  return requireLocal(plugin.name).call(null, tree, options);
};

module.exports.preprocessCss = function(tree, inputPath, outputPath, options) {
  var plugins = options.registry.load('css');

  if (plugins.length === 0) {
    var Funnel = require('broccoli-funnel');

    return new Funnel(tree, {
      srcDir: inputPath,

      getDestinationPath: function(relativePath) {
        if (options.outputPaths) {
          // options.outputPaths is not present when compiling
          // an addon's styles
          var path = relativePath.replace(/\.css$/, '');

          // is a rename rule present?
          if (options.outputPaths[path]) {
            return options.outputPaths[path];
          }
        }

        return outputPath + '/' + relativePath;
      }
    });
  }

  return processPlugins(plugins, arguments);
};

module.exports.preprocessTemplates = function(/* tree */) {
  var options = arguments[arguments.length - 1];
  var plugins = options.registry.load('template');

  if (plugins.length === 0) {
    throw new Error('Missing template processor');
  }

  return processPlugins(plugins, arguments);
};

module.exports.preprocessJs = function(/* tree, inputPath, outputPath, options */) {
  var options = arguments[arguments.length - 1];
  var plugins = options.registry.load('js');
  var tree    = arguments[0];

  if (plugins.length === 0) { return tree; }

  return processPlugins(plugins, arguments);
};

function processPlugins(plugins, args) {
  args = Array.prototype.slice.call(args);
  var tree = args.shift();

  plugins.forEach(function(plugin) {
    tree = plugin.toTree.apply(plugin, [tree].concat(args));
  });

  return tree;
}
