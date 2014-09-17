'use strict';

var Plugin           = require('./plugin');
var StylePlugin      = require('./style-plugin');
var TemplatePlugin   = require('./template-plugin');
var JavascriptPlugin = require('./javascript-plugin');

function Registry(plugins, app) {
  this.registry = {
    js: [],
    css: [],
    'minify-css': [],
    template: []
  };
  this.instantiatedPlugins = [];
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
  var plugins = this.registeredForType(type).map(function(plugin) {
    if(this.instantiatedPlugins.indexOf(plugin) > -1 || this.availablePlugins.hasOwnProperty(plugin.name)) {
      return plugin;
    }
  }.bind(this));

  return plugins.filter(Boolean);
};

Registry.prototype.registeredForType = function(type) {
  return this.registry[type] = this.registry[type] || [];
};

Registry.prototype.add = function(type, name, extension, options) {
  var registered = this.registeredForType(type);
  var plugin, PluginType;

  // plugin is being added directly do not instantiate it
  if (typeof name === 'object') {
    plugin = name;
    this.instantiatedPlugins.push(plugin);
  } else {
    PluginType = this.pluginTypes[type] || Plugin;
    options = options || {};
    options.applicationName = this.app.name;
    options.app = this.app;

    plugin = new PluginType(name, extension, options);
  }

  registered.push(plugin);
};
