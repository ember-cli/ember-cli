'use strict';

var Promise = require('../ext/promise');
var path    = require('path');
var findup  = Promise.denodeify(require('findup'));
var resolve = Promise.denodeify(require('resolve'));
var fs      = require('fs');
var assign  = require('lodash-node/modern/objects/assign');
var DAG     = require('../utilities/DAG');
var Command = require('../models/command');
var Addon   = require('../models/addon');

var emberCLIVersion = require('../utilities/ember-cli-version');

function Project(root, pkg) {
  this.root          = root;
  this.pkg           = pkg;
  this.addonPackages = {};
  this.liveReloadFilterPatterns = [];
}

var NULL_PROJECT = new Project(process.cwd(), {});

NULL_PROJECT.isEmberCLIProject = function() {
  return false;
};

NULL_PROJECT.isEmberCLIAddon = function() {
  return false;
};

NULL_PROJECT.name = function() {
  return path.basename(process.cwd());
};

Project.NULL_PROJECT = NULL_PROJECT;


Project.prototype.name = function() {
  return this.pkg.name;
};

Project.prototype.isEmberCLIProject = function() {
  return this.pkg.devDependencies && 'ember-cli' in this.pkg.devDependencies;
};

Project.prototype.isEmberCLIAddon = function() {
  return this.pkg.keywords && this.pkg.keywords.indexOf('ember-addon') > -1;
};

Project.prototype.config = function(env) {
  var configPath = 'config';

  if (this.pkg['ember-addon'] && this.pkg['ember-addon']['configPath']) {
    configPath = this.pkg['ember-addon']['configPath'];
  }
  if (fs.existsSync(path.join(this.root, configPath, 'environment.js'))) {
    return this.require('./' + path.join(configPath, 'environment'))(env);
  } else {
    return { };
  }
};

Project.prototype.has = function(file) {
  return fs.existsSync(path.join(this.root, file)) || fs.existsSync(path.join(this.root, file + '.js'));
};

Project.prototype.resolve = function(file) {
  return resolve(file, {
    basedir: this.root
  });
};

Project.prototype.require = function(file) {
  if (/^\.\//.test(file)) { // Starts with ./
    return require(path.join(this.root, file));
  } else {
    return require(path.join(this.root, 'node_modules', file));
  }
};

Project.prototype.emberCLIVersion = emberCLIVersion;

Project.prototype.dependencies = function(pkg) {
  pkg = pkg || this.pkg || {};
  return assign({}, pkg['devDependencies'], pkg['dependencies']);
};

Project.prototype.buildAddonPackages = function() {
  if (!this.root) { return; }

  var internalMiddlewarePath = path.join(this.root, path.relative(this.root, path.join(__dirname, '../tasks/server/middleware')));

  this.addIfAddon(path.join(internalMiddlewarePath, 'history-support'));
  this.addIfAddon(path.join(internalMiddlewarePath, 'serve-files'));
  this.addIfAddon(path.join(internalMiddlewarePath, 'proxy-server'));

  this.discoverAddons(this.root, this.pkg);
};

Project.prototype.discoverAddons = function(root, pkg) {
  Object.keys(this.dependencies(pkg)).forEach(function(name) {
    if (name !== 'ember-cli') {
      var addonPath = path.join(root, 'node_modules', name);
      this.addIfAddon(addonPath);
    }
  }, this);

  if (pkg['ember-addon'] && pkg['ember-addon'].paths) {
    pkg['ember-addon'].paths.forEach(function(addonPath) {
      addonPath = path.join(root, addonPath);
      this.addIfAddon(addonPath);
    }, this);
  }
};

Project.prototype.addIfAddon = function(addonPath) {
  var pkgPath = path.join(addonPath, 'package.json');

  if(fs.existsSync(pkgPath)) {
    var addonPkg = require(pkgPath);
    var keywords = addonPkg.keywords || [];

    addonPkg['ember-addon'] = addonPkg['ember-addon'] || {};

    if (keywords.indexOf('ember-addon') > -1) {
      this.discoverAddons(addonPath, addonPkg);
      this.addonPackages[addonPkg.name] = {
        path: addonPath,
        pkg: addonPkg
      };
    }
  }
};

Project.prototype.initializeAddons = function() {
  var project         = this;
  var graph           = new DAG();
  var addon, emberAddonConfig;

  this.buildAddonPackages();

  for (var name in this.addonPackages) {
    addon            = this.addonPackages[name];
    emberAddonConfig = addon.pkg['ember-addon'];

    graph.addEdges(name, addon, emberAddonConfig.before, emberAddonConfig.after);
  }

  this.addons = [];
  graph.topsort(function (vertex) {
    var addon           = vertex.value;
    var AddonConstructor = Addon.lookup(addon);

    project.addons.push(new AddonConstructor(project));
  });
};

Project.prototype.addonCommands = function() {
  var commands = {};
  this.addons.forEach(function(addon){
    var includedCommands = (addon.includedCommands && addon.includedCommands()) || {};
    var addonCommands = {};
    for (var key in includedCommands) {
      addonCommands[key] = Command.extend(includedCommands[key]);
    }
    if(Object.keys(addonCommands).length) {
      commands[addon.name] = addonCommands;
    }
  });
  return commands;
};

Project.prototype.eachAddonCommand = function(callback) {
  if(this.initializeAddons && this.addonCommands) {
    this.initializeAddons();
    var addonCommands = this.addonCommands();

    Object.keys(addonCommands).forEach(function(addonName){
      callback(addonName, addonCommands[addonName]);
    }.bind(this));
  }
};

Project.prototype.localBlueprintLookupPath = function() {
  return path.join(this.root, 'blueprints');
};

Project.prototype.blueprintLookupPaths = function() {
  if (this.isEmberCLIProject()) {
    var lookupPaths = [this.localBlueprintLookupPath()];
    var addonLookupPaths = this.addonBlueprintLookupPaths();

    return lookupPaths.concat(addonLookupPaths);
  } else {
    return [];
  }
};

Project.prototype.addonBlueprintLookupPaths = function() {
  var addonPaths = this.addons.map(function(addon) {
    if (addon.blueprintsPath) {
      return addon.blueprintsPath();
    }
  }, this);

  return addonPaths.filter(Boolean);
};

Project.closest = function(pathName) {
  return closestPackageJSON(pathName)
    .then(function(result) {

      if (result.pkg && result.pkg.name === 'ember-cli') {
        return NULL_PROJECT;
      }

      return new Project(result.directory, result.pkg);
    })
    .catch(function(reason) {
      handleFindupError(pathName, reason);
    });
};

Project.closestSync = function(pathName) {
  try {
    var directory = findup.sync(pathName, 'package.json');
    var pkg = require(path.join(directory, 'package.json'));

    if (pkg && pkg.name === 'ember-cli') {
      return NULL_PROJECT;
    }

    return new Project(directory, pkg);
  } catch(reason) {
    handleFindupError(pathName, reason);
  }
};

function NotFoundError(message) {
  this.name = 'NotFoundError';
  this.message = message;
  this.stack = (new Error()).stack;
}

NotFoundError.constructor = NotFoundError;
NotFoundError.prototype = Object.create(Error.prototype);

Project.NotFoundError = NotFoundError;

function closestPackageJSON(pathName) {
  return findup(pathName, 'package.json')
    .then(function(directory) {
      return Promise.hash({
        directory: directory,
        pkg: require(path.join(directory, 'package.json'))
      });
    });
}

function handleFindupError(pathName, reason) {
  // Would be nice if findup threw error subclasses
  if (reason && /not found/i.test(reason.message)) {
    throw new NotFoundError('No project found at or up from: `' + pathName + '`');
  } else {
    throw reason;
  }
}

// Export
module.exports = Project;

