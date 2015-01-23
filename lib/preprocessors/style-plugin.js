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

StylePlugin.prototype.toTree = function(inputTree, inputPath, outputPath, options) {
  var _this = this;
  return {
    read: function (readTree) {
      return readTree(inputTree).then(function (inputTreeRoot) {
        options = merge({}, this.options, options);
        var paths = options.outputPaths;
        var trees = Object.keys(paths).map(function (file) {
          var ext = _this.getExt(inputTreeRoot, inputPath, file);
          if (!ext) {
            var attemptedExtensions;
            if (Array.isArray(_this.ext)) {
              attemptedExtensions = '.[' + _this.ext.join('|') + ']';
            } else {
              attemptedExtensions = '.' + _this.ext;
            }
            throw new SilentError(path.join(inputTreeRoot, inputPath, file) +
              attemptedExtensions + ' does not exist');
          }
          var input = path.join(inputPath, file + '.' + ext);
          var output = paths[file];
          return requireLocal(_this.name).call(null,
            [inputTree], input, output, options);
        });
        return readTree(mergeTrees(trees));
      });
    },
    cleanup: function () {}
  };
};


module.exports = StylePlugin;

