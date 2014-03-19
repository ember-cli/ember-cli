'use strict';

var requireLocal = require('../utilities/require-local');

module.exports.supportedPlugins = {
  'coffee': 'broccoli-coffee',
  'sweetjs': 'broccoli-sweetjs'
};

module.exports.coffee = function(tree, inputPath, outputPath, options) {
  console.log('compiling coffeescript to: ', outputPath);
  var compiler = requireLocal('broccoli-coffee');
  options = options || {};
  options.bare = true;
  options.srcDir = inputPath;
  options.destDir = outputPath;
  return compiler(tree, options);
};

module.exports.sweetjs = function(tree, options) {
  var compiler = requireLocal('broccoli-sweetjs');
  return compiler(tree, options);
};
