'use strict';

var path         = require('path');
var Plugin       = require('./plugin');
var requireLocal = require('../utilities/require-local');
var merge        = require('lodash-node/modern/objects/merge');
var fs           = require('fs');
var mergeTrees   = require('broccoli-merge-trees');

function StylePlugin () {
  this.type = 'css';
  this._superConstructor.apply(this, arguments);
}

StylePlugin.prototype = Object.create(Plugin.prototype);
StylePlugin.prototype.constructor = StylePlugin;
StylePlugin.prototype._superConstructor = Plugin;

StylePlugin.prototype.toTree = function(tree, inputPath, outputPath, options) {
  var files = fs.readdirSync('.'+inputPath);
  var trees = [];

  for (var i=0; i<files.length; i++) {
    var file = files[i];

    if (file.match(/^_|^\./)) {
      continue;
    }

    var name = file.split('.')[0];
    var input = path.join(inputPath, file);
    var output = path.join(outputPath, name + '.css');
    trees.push(requireLocal(this.name).call(null, [tree], input, output, merge({}, this.options, options)));
  }

  return mergeTrees(trees);
};


module.exports = StylePlugin;
