'use strict';

var Plugin       = require('./plugin');
var requireLocal = require('../utilities/require-local');

function JavascriptPlugin () {
  this.type = 'js';
  this._superConstructor.apply(this, arguments);
}

JavascriptPlugin.prototype = Object.create(Plugin.prototype);
JavascriptPlugin.prototype.constructor = JavascriptPlugin;
JavascriptPlugin.prototype._superConstructor = Plugin;

JavascriptPlugin.prototype.toTree = function(tree, inputPath, outputPath, options) {
  if (this.name.indexOf('coffee') !== -1 || this.name.indexOf('ember-script') !== -1) {
    options = options || {};
    options.bare = true;
    options.srcDir = inputPath;
    options.destDir = outputPath;
  }

  return requireLocal(this.name).call(null, tree, options);
};

module.exports = JavascriptPlugin;
