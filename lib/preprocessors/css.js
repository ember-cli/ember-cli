'use strict';

var path = require('path');
var broccoli = require('broccoli');
var requireLocal = require('../utilities/require-local');

module.exports.supportedPlugins = {
  'sass': 'broccoli-sass',
  'less': 'broccoli-less-single',
  'stylus': 'broccoli-stylus-single'
};

module.exports.fallback = 'css';

module.exports.sass = function(trees, inputPath, outputPath, options) {
  var compiler = requireLocal('broccoli-sass');
  return compiler(trees, path.join(inputPath, 'app.scss'), path.join(outputPath, 'app.css'), options);
};

module.exports.less = function(trees, inputPath, outputPath, options) {
  var compiler = requireLocal('broccoli-less-single');
  return compiler(trees, path.join(inputPath, 'app.less'), path.join(outputPath, 'app.css'), options);
};

module.exports.stylus = function(trees, inputPath, outputPath, options) {
  var compiler = requireLocal('broccoli-stylus-single');
  return compiler(trees, path.join(inputPath, 'app.styl'), path.join(outputPath, 'app.css'), options);
};

module.exports.css = function(trees, inputPath, outputPath) {
  var compiler = requireLocal('broccoli-static-compiler');
  return compiler(new broccoli.MergedTree(trees), {
    srcDir: inputPath,
    destDir: outputPath
  });
};
