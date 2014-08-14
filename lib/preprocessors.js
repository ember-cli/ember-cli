'use strict';

var path         = require('path');
var Registry     = require('./preprocessors/registry');
var requireLocal = require('./utilities/require-local');

module.exports.setupRegistry = function(app) {
  var registry = new Registry(app.project.dependencies(), app);

  registry.add('css', 'broccoli-sass', ['scss', 'sass']);
  registry.add('css', 'broccoli-ruby-sass', ['scss', 'sass']);
  registry.add('css', 'broccoli-less-single', 'less');
  registry.add('css', 'broccoli-stylus-single', 'styl');

  registry.add('minify-css', 'broccoli-csso', null);

  registry.add('js', 'broccoli-ember-script', 'em');
  registry.add('js', 'broccoli-sweetjs', 'js');

  registry.add('template', 'broccoli-ember-hbs-template-compiler', ['hbs', 'handlebars']);
  registry.add('template', 'broccoli-emblem-compiler', ['embl', 'emblem']);

  return registry;
};

module.exports.isType = function(file, type, options) {
  var plugins   = options.registry.registry[type] || [];
  var extension = path.extname(file).replace('.', '');

  for (var i = 0; i < plugins.length; i++) {
    if (extension === plugins[i].ext) {
      return true;
    }
  }
};

module.exports.preprocessMinifyCss = function(tree, options) {
  var plugin = options.registry.load('minify-css');

  if (!plugin) {
    var compiler = require('broccoli-clean-css');
    return compiler(tree, options);
  }

  return requireLocal(plugin.name).call(null, tree, options);
};

module.exports.preprocessCss = function(tree, inputPath, outputPath, options) {
  var plugin = options.registry.load('css');

  if (!plugin) {
    var compiler = require('broccoli-static-compiler');
    var fileMover = require('broccoli-file-mover');

    var styles = compiler(tree, {
      srcDir: inputPath,
      destDir: outputPath
    });

    // when our application is named `app` there is no
    // need to move the static css file.
    if (options.registry.app.name === 'app') {
      return styles;
    }

    return fileMover(styles, {
      srcFile: outputPath + '/app.css',
      destFile: outputPath + '/' + options.registry.app.name + '.css'
    });
  }

  return plugin.toTree.apply(plugin, arguments);
};

module.exports.preprocessTemplates = function(/* tree */) {
  var options = arguments[arguments.length - 1];
  var plugin = options.registry.load('template');

  if (!plugin) {
    throw new Error('Missing template processor');
  }

  return plugin.toTree.apply(plugin, arguments);
};

module.exports.preprocessJs = function(/* tree, inputPath, outputPath, options */) {
  var options = arguments[arguments.length - 1];
  var plugin = options.registry.load('js');

  if (!plugin) { return arguments[0]; }

  return plugin.toTree.apply(plugin, arguments);
};
