'use strict';

var path   = require('path');
var fs     = require('fs');
var detect = require('lodash-node/modern/collections/find');

function Plugin(name, ext) {
  this.name = name;
  this.ext = ext;
}

function Registry(plugins) {
  this.registry = {};
  this.availablePlugins = plugins;
}

module.exports = Registry;

Registry.prototype.load = function(type) {
  return this.registry[type].reduce(function(actual, plugin) {
    if(this.availablePlugins.hasOwnProperty(plugin.name)) {
      return plugin;
    } else {
      return actual;
    }
  }.bind(this), null);
};


Registry.prototype.add = function(type, name, extension) {
  var registered = this.registry[type] = this.registry[type] || [];

  registered.push(new Plugin(name, extension));
};

Plugin.prototype.getExt = function(inputPath, filename) {
  if(Array.isArray(this.ext)) {
    return detect(this.ext, function(ext) {
      var filenameAndExt = filename + '.' + ext;
      return fs.existsSync(path.join('.', inputPath, filenameAndExt));
    });
  } else {
    return this.ext;
  }
};
