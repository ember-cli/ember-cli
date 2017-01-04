'use strict';

let Project = require('../../lib/models/project');
let Instrumentation = require('../../lib/models/instrumentation');
let MockUI = require('console-ui/mock');
let td = require('testdouble');

function MockProject() {
  let root = process.cwd();
  let pkg = {};
  let ui = new MockUI();
  let instr = new Instrumentation({
    ui,
    initInstrumentation: {
      token: null,
      node: null,
    },
  });
  let cli = {
    instrumentation: instr,
  };
  Project.apply(this, [root, pkg, ui, cli]);

  let discoverFromCli = td.replace(this.addonDiscovery, 'discoverFromCli');
  td.when(discoverFromCli(), { ignoreExtraArgs: true }).thenReturn([]);
}

MockProject.prototype.require = function(file) {
  if (file === './server') {
    return function() {
      return {
        listen() { arguments[arguments.length - 1](); },
      };
    };
  }
};

MockProject.prototype.config = function() {
  return this._config || {
    baseURL: '/',
    locationType: 'auto',
  };
};

MockProject.prototype.has = function(key) {
  return (/server/.test(key));
};

MockProject.prototype.name = function() {
  return 'mock-project';
};

MockProject.prototype.initializeAddons = Project.prototype.initializeAddons;
MockProject.prototype.hasDependencies = function() {
  return true;
};
MockProject.prototype.discoverAddons = Project.prototype.discoverAddons;
MockProject.prototype.addIfAddon = Project.prototype.addIfAddon;
MockProject.prototype.supportedInternalAddonPaths = Project.prototype.supportedInternalAddonPaths;
MockProject.prototype.setupBowerDirectory = Project.prototype.setupBowerDirectory;
MockProject.prototype.setupNodeModulesPath = Project.prototype.setupNodeModulesPath;
MockProject.prototype.isEmberCLIProject = Project.prototype.isEmberCLIProject;
MockProject.prototype.isEmberCLIAddon = Project.prototype.isEmberCLIAddon;
MockProject.prototype.findAddonByName = Project.prototype.findAddonByName;
MockProject.prototype.dependencies = function() {
  return [];
};
MockProject.prototype.isEmberCLIAddon = function() {
  return false;
};

module.exports = MockProject;
