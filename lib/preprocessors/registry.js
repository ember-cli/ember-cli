'use strict';

var path   = require('path');
var fs     = require('fs');
var detect = require('lodash-node/modern/collections/find');
var requireLocal = require('../utilities/require-local');

function Plugin(name, ext, options) {
  this.name = name;
  this.ext = ext;
  this.options = options || {};
  this.registry = this.options.registry;
  this.applicationName = this.options.applicationName;

  if (this.options.toTree) {
    this.toTree = this.options.toTree;
  }
}

Plugin.prototype.toTree = function(tree, inputPath, outputPath, options) {
  var input = path.join(inputPath, 'app.' + this.getExt(inputPath, 'app'));
  var output = path.join(outputPath, this.applicationName + '.css');

  return requireLocal(this.name).call(null, [tree], input, output, options);
};

function Registry(plugins, app) {
  this.registry = {};
  this.availablePlugins = plugins;
  this.app = app;
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


Registry.prototype.add = function(type, name, extension, options) {
  var registered = this.registry[type] = this.registry[type] || [];

  options = options || {};
  options.applicationName = this.app.name;

  var plugin = new Plugin(name, extension, options);

  registered.push(plugin);
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
