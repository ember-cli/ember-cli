'use strict';

var Plugin           = require('./plugin');
var StylePlugin      = require('./style-plugin');
var TemplatePlugin   = require('./template-plugin');
var JavascriptPlugin = require('./javascript-plugin');

function Registry(plugins, app) {
  this.registry = {};
  this.availablePlugins = plugins;
  this.app = app;
  this.pluginTypes = {
    'js': JavascriptPlugin,
    'css': StylePlugin,
    'template': TemplatePlugin
  };
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
  var plugin, PluginType;

  // plugin is being added directly do not instantiate it
  if (typeof name === 'object') {
    plugin = name;
  } else {
    PluginType = this.pluginTypes[type] || Plugin;
    options = options || {};
    options.applicationName = this.app.name;

    plugin = new PluginType(name, extension, options);
  }

  registered.push(plugin);
};
