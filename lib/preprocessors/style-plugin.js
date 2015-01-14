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
  var _this = this,
      paths = options.outputPaths;

  var trees = Object.keys(paths).map(function (file) {
    var ext = _this.getExt(inputPath, file);
    if (!ext) {
      var attemptedExtensions = Array.isArray(_this.ext) ? _this.ext : [_this.ext];
      throw new SilentError('app/styles/' + file + '.[' + attemptedExtensions.join('/') + '] does not exist');
    }
    var input = path.join(inputPath, file + '.' + ext);
    var output = paths[file];

    return requireLocal(_this.name).call(null, [tree], input, output, options);
  });

  return mergeTrees(trees);
};


module.exports = StylePlugin;

