'use strict';

var Plugin       = require('./plugin');
var requireLocal = require('../utilities/require-local');

function TemplatePlugin () {
  this.type = 'template';
  this._superConstructor.apply(this, arguments);
}

TemplatePlugin.prototype = Object.create(Plugin.prototype);
TemplatePlugin.prototype.constructor = TemplatePlugin;
TemplatePlugin.prototype._superConstructor = Plugin;

TemplatePlugin.prototype.toTree = function(tree) {
  return requireLocal(this.name).call(null, tree, {
    extensions: this.ext,
    module: true
  });
};


module.exports = TemplatePlugin;

