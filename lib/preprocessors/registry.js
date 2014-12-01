'use strict';

var Plugin           = require('./plugin');
var StylePlugin      = require('./style-plugin');
var TemplatePlugin   = require('./template-plugin');
var JavascriptPlugin = require('./javascript-plugin');
var uniq             = require('lodash-node/underscore/arrays/uniq');
var debug            = require('debug')('ember-cli:registry');

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

Registry.prototype.extensionsForType = function(type) {
  var registered = this.registeredForType(type);

  var extensions =  registered.reduce(function(memo, plugin) {
    return memo.concat(plugin.ext);
  }, [type]);

  return uniq(extensions);
};

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
  debug('add type: %s, name: %s, extension:%s, options:%s', type, name, extension, options);

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

Registry.prototype.remove = function(type, name) {
  debug('remove type: %s, name: %s', type, name);

  var registered = this.registeredForType(type);
  var registeredIndex, instantiatedPluginIndex;

  // plugin is being added directly do not instantiate it
  if (typeof name === 'object') {
    instantiatedPluginIndex = this.instantiatedPlugins.indexOf(name);
    registeredIndex = registered.indexOf(name);

    if (instantiatedPluginIndex !== -1) {
      this.instantiatedPlugins.splice(instantiatedPluginIndex, 1);
    }
  } else {
    for (var i = 0, l = registered.length; i < l; i++) {
      if (registered[i].name === name) {
        registeredIndex = i;
      }
    }
  }

  if (registeredIndex !== -1) {
    registered.splice(registeredIndex, 1);
  }
};
