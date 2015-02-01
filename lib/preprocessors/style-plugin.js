'use strict';

var path         = require('path');
var Plugin       = require('./plugin');
var requireLocal = require('../utilities/require-local');
var merge        = require('lodash-node/modern/objects/merge');
var mergeTrees   = require('broccoli-merge-trees');

function StylePlugin () {
  this.type = 'css';
  this._superConstructor.apply(this, arguments);
}

StylePlugin.prototype = Object.create(Plugin.prototype);
StylePlugin.prototype.constructor = StylePlugin;
StylePlugin.prototype._superConstructor = Plugin;

StylePlugin.prototype.toTree = function(inputTree, inputPath, outputPath, options) {
  var self = this;
  return {
    read: function (readTree) {
      return readTree(inputTree).then(function (inputTreeRoot) {
        options = merge({}, self.options, options);
        var paths = options.outputPaths;

        var trees = Object.keys(paths).map(function (file) {
          var ext = self.getExt(inputTreeRoot, inputPath, file);

          if (ext) { 
            var input = path.join(inputPath, file + '.' + ext);
            var output = paths[file];

            return requireLocal(self.name).call(null, [inputTree], input, output, options);
          }
        });

        trees = trees.filter(function(n){ return n !== undefined; });

        return readTree(mergeTrees(trees));
      });
    },
    cleanup: function () {}
  };
};


module.exports = StylePlugin;
