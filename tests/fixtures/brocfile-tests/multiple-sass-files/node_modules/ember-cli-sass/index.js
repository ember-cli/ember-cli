'use strict';

var path = require('path');
var mergeTrees = require('broccoli-merge-trees');
var SassCompiler = require('../broccoli-sass');

function SASSPlugin() {
  this.name = 'ember-cli-sass';
  this.ext = ['scss', 'sass'];
}

SASSPlugin.prototype.toTree = function(tree, inputPath, outputPath, inputOptions) {
  var options = inputOptions;

  var inputTrees = [tree];
  if (options.includePaths) {
    inputTrees = inputTrees.concat(options.includePaths);
  }

  var ext = options.extension || 'scss';
  var paths = options.outputPaths;
  var trees = Object.keys(paths).map(function(file) {
    var input = path.join(inputPath, file + '.' + ext);
    var output = paths[file];
    return new SassCompiler(inputTrees, input, output, options);
  });

  return mergeTrees(trees);
};

module.exports = {
  name: 'ember-cli-sass',

  setupPreprocessorRegistry: function(type, registry) {
    registry.add('css', new SASSPlugin());
  },
};
