'use strict';

var Project = require('../../lib/models/project');

function MockProject() {
  Project.apply(this, arguments);
  this.root = process.cwd();
  this.pkg = {};
}

MockProject.prototype.require = function(file) {
  if (file === './server') {
    return function() {
      return {
        listen: function() { arguments[arguments.length-1](); }
      };
    };
  }
};

MockProject.prototype.config = function() {
  return this._config || {
    baseURL: '/',
    locationType: 'auto'
  };
};

MockProject.prototype.has = function(key) {
  return (/server/.test(key));
};

MockProject.prototype.name = function() {
  return 'mock-project';
};

MockProject.prototype.initializeAddons = Project.prototype.initializeAddons;
MockProject.prototype.buildAddonPackages = Project.prototype.buildAddonPackages;
MockProject.prototype.discoverAddons = Project.prototype.discoverAddons;
MockProject.prototype.addIfAddon = Project.prototype.addIfAddon;
MockProject.prototype.dependencies = function() {
  return [];
};

module.exports = MockProject;
