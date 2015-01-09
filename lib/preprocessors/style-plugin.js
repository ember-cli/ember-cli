'use strict';

var path         = require('path');
var Plugin       = require('./plugin');
var requireLocal = require('../utilities/require-local');
var merge        = require('lodash-node/modern/objects/merge');
var SilentError  = require('../errors/silent');
var mergeTrees   = require('broccoli-merge-trees');

function StylePlugin () {
  this.type = 'css';
  this._superConstructor.apply(this, arguments);
}

StylePlugin.prototype = Object.create(Plugin.prototype);
StylePlugin.prototype.constructor = StylePlugin;
StylePlugin.prototype._superConstructor = Plugin;

StylePlugin.prototype.toTree = function(tree, inputPath, outputPath, options) {
  options = merge({}, this.options, options);
  
  var paths = options.outputPaths;

  // outputPaths are not available in Addons
  if (paths) {
    var self = this;
    var trees = Object.keys(paths).map(function (file) {
      return self._processFile(tree, file, inputPath, paths[file], options);
    });

    return mergeTrees(trees);
  } else {
    var file = options.fileName || 'app';
    outputPath = path.join(outputPath, file + '.css');
    return this._processFile(tree, file, inputPath, outputPath, options);
  }
};

StylePlugin.prototype._processFile = function(tree, file, inputPath, outputPath, options) { 
  var filePath = options.stylesPath || path.join('.', inputPath);
  var ext = this.getExt(filePath, file);
  if (!ext) {
    var attemptedExtensions = Array.isArray(this.ext) ? this.ext.join('/') : this.ext;
    throw new SilentError(path.join(filePath, file) + '.[' + attemptedExtensions + '] does not exist');
  }
  var input = path.join(inputPath, file + '.' + ext);
  return requireLocal(this.name).call(null, [tree], input, outputPath, options);
};


module.exports = StylePlugin;

