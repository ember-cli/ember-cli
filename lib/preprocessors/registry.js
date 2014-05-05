'use strict';

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
