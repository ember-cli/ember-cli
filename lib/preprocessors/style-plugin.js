'use strict';

var path         = require('path');
var Plugin       = require('./plugin');
var requireLocal = require('../utilities/require-local');
var merge        = require('lodash/object/merge');
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
  var self = this;
  return {
    read: function (readTree) {
      return readTree(inputTree).then(function (inputTreeRoot) {
        options = merge({}, self.options, options);
        var paths = options.outputPaths;

        var trees = Object.keys(paths).map(function (file) {
          var ext = self.getExt(inputTreeRoot, inputPath, file);
         
          // Throw an error if no valid file was found
          if (!ext) {
            var attemptedExtensions;
            if (Array.isArray(self.ext)) {
              attemptedExtensions = '.[' + self.ext.join('|') + ']';
            } else {
              attemptedExtensions = '.' + self.ext;
            }
            throw new SilentError(path.join(inputTreeRoot, inputPath, file) + attemptedExtensions + ' does not exist');
          }

          var input = path.join(inputPath, file + '.' + ext);
          var output = paths[file];

          return requireLocal(self.name).call(null, [inputTree], input, output, options);
        });

        return readTree(mergeTrees(trees));
      });
    },
    cleanup: function () {}
  };
};


module.exports = StylePlugin;
