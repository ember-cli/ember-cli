'use strict';

var path         = require('path');
var Plugin       = require('./plugin');
var requireLocal = require('../utilities/require-local');
var merge        = require('lodash-node/modern/objects/merge');
var SilentError  = require('../errors/silent');

function StylePlugin () {
  this.type = 'css';
  this._superConstructor.apply(this, arguments);
}

StylePlugin.prototype = Object.create(Plugin.prototype);
StylePlugin.prototype.constructor = StylePlugin;
StylePlugin.prototype._superConstructor = Plugin;

StylePlugin.prototype.toTree = function(tree, inputPath, outputPath, options) {
  var ext = this.getExt(inputPath, 'app');

  if (!ext) {
    var attemptedExtensions = Array.isArray(this.ext) ? this.ext : [this.ext];
    throw new SilentError('app/styles/app.[' + attemptedExtensions.join('/') + '] does not exist');
  }

  var input = path.join(inputPath, 'app.' + ext);
  var output = path.join(outputPath, this.applicationName + '.css');

  return requireLocal(this.name).call(null, [tree], input, output, merge({}, this.options, options));
};


module.exports = StylePlugin;

