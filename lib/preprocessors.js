'use strict';

var assign       = require('lodash-node/modern/objects/assign');
var pkg          = require(process.cwd() + '/package');
var deps         = assign(pkg['devDependencies'], pkg['dependencies']);
var path         = require('path');
var Registry     = require('./preprocessors/registry');
var requireLocal = require('./utilities/require-local');

var registry = new Registry(deps);

registry.add('css', 'broccoli-sass', 'scss');
registry.add('css', 'broccoli-ruby-sass', ['scss', 'sass']);
registry.add('css', 'broccoli-less-single', 'less');
registry.add('css', 'broccoli-stylus-single', 'styl');

registry.add('minify-css', 'broccoli-csso', null);

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

module.exports.preprocessMinifyCss = function(tree, options) {
  var plugin = registry.load('minify-css');

  if (!plugin) {
    var compiler = require('broccoli-clean-css');
    return compiler(tree, options);
  }

  return requireLocal(plugin.name).call(null, tree, options);
};

module.exports.preprocessCss = function(tree, inputPath, outputPath, options) {
  var plugin = registry.load('css');

  if (!plugin) {
    var compiler = require('broccoli-static-compiler');
    var fileMover = require('broccoli-file-mover');

    var styles = compiler(tree, {
      srcDir: inputPath,
      destDir: outputPath
    });

    return fileMover(styles, {
      srcFile: 'assets/app.css',
      destFile: 'assets/' + pkg.name + '.css'
    });
  }

  var input = path.join(inputPath, 'app.' + plugin.getExt(inputPath, 'app'));
  var output = path.join(outputPath, pkg.name + '.css');
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
