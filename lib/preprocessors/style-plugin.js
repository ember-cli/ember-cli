'use strict';

var path         = require('path');
var Plugin       = require('./plugin');
var requireLocal = require('../utilities/require-local');
var merge        = require('lodash-node/modern/objects/merge');

function StylePlugin () {
  this.type = 'css';
  this._superConstructor.apply(this, arguments);
}

StylePlugin.prototype = Object.create(Plugin.prototype);
StylePlugin.prototype.constructor = StylePlugin;
StylePlugin.prototype._superConstructor = Plugin;

StylePlugin.prototype.toTree = function(tree, inputPath, outputPath, options) {
  var input = path.join(inputPath, 'app.' + this.getExt(inputPath, 'app'));
  var output = path.join(outputPath, this.applicationName + '.css');

  return requireLocal(this.name).call(null, [tree], input, output, merge({}, this.options, options));
};


module.exports = StylePlugin;

