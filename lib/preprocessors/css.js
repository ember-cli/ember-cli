'use strict';

var path = require('path');
var broccoli = require('broccoli')

module.exports.supportedPlugins = {
  'sass': 'broccoli-sass',
  'less': 'broccoli-less',
  'stylus': 'broccoli-stylus'
};

module.exports.fallback = 'css';

module.exports.sass = function(trees, inputPath, outputPath, options) {
  var compiler = require(path.join(process.cwd(), 'node_modules', 'broccoli-sass'));
  return compiler(trees, path.join(inputPath, 'app.scss'), path.join(outputPath, 'app.css'), options);
};

module.exports.less = function(trees, inputPath, outputPath, options) {
  var compiler = require('broccoli-less');
  return compiler(trees, options);
};

module.exports.stylus = function(trees, inputPath, outputPath, options) {
  var compiler = require('broccoli-stylus');
  return compiler(trees, options);
};

module.exports.css = function(trees, inputPath, outputPath) {
  var compiler = require('broccoli-static-compiler');
  return compiler(new broccoli.MergedTree(trees), {
    srcDir: inputPath,
    destDir: outputPath
  });
};
