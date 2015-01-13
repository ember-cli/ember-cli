'use strict';

var Promise = require('../ext/promise');
var path    = require('path');
var findup  = Promise.denodeify(require('findup'));
var resolve = Promise.denodeify(require('resolve'));
var fs      = require('fs');
var assign  = require('lodash-node/modern/objects/assign');
var find    = require('lodash-node/modern/collections/find');
var DAG     = require('../utilities/DAG');
var Command = require('../models/command');
var Addon   = require('../models/addon');
var merge   = require('lodash-node/modern/objects/merge');
var forOwn  = require('lodash-node/modern/objects/forOwn');
var debug   = require('debug')('ember-cli:project');

var emberCLIVersion = require('../utilities/ember-cli-version');

function Project(root, pkg) {
  debug('init root: %s', root);
  this.root          = root;
  this.pkg           = pkg;
  this.addonPackages = {};
  this.liveReloadFilterPatterns = [];
  this.setupBowerDirectory();
}

Project.prototype.setupBowerDirectory = function() {
  var bowerrcPath = path.join(this.root, '.bowerrc');

  debug('bowerrc path: %s', bowerrcPath);

  if (fs.existsSync(bowerrcPath)) {
    var bowerrcContent = fs.readFileSync(bowerrcPath);
    try {
      this.bowerDirectory = JSON.parse(bowerrcContent).directory;
    } catch (exception) {
      debug('failed to parse bowerc: %s', exception);
      this.bowerDirectory = null;
    }
  }

  this.bowerDirectory = this.bowerDirectory || 'bower_components';
  debug('bowerDirectory: %s', this.bowerDirectory);
};

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

Project.prototype.configPath = function() {
  var configPath = 'config';

  if (this.pkg['ember-addon'] && this.pkg['ember-addon']['configPath']) {
    configPath = this.pkg['ember-addon']['configPath'];
  }

  return path.join(configPath, 'environment');
};

Project.prototype.config = function(env) {
  var configPath = this.configPath();

  if (fs.existsSync(path.join(this.root, configPath + '.js'))) {
    var appConfig = this.require('./' + configPath)(env);
    var addonsConfig = this.getAddonsConfig(env, appConfig);

    return merge(addonsConfig, appConfig);
  } else {
    return this.getAddonsConfig(env, {});
  }
};

Project.prototype.getAddonsConfig = function(env, appConfig) {
  this.initializeAddons();

  var initialConfig = merge({}, appConfig);

  return this.addons.reduce(function(config, addon) {
    if (addon.config) {
      merge(config, addon.config(env, config));
    }

    return config;
  }, initialConfig);
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

Project.prototype.dependencies = function(pkg, excludeDevDeps) {
  pkg = pkg || this.pkg || {};

  var devDependencies = pkg['devDependencies'];
  if (excludeDevDeps) {
    devDependencies = {};
  }

  return assign({}, devDependencies, pkg['dependencies']);
};

Project.prototype.bowerDependencies = function(bower) {
  if (!bower) {
    var bowerPath = path.join(this.root, 'bower.json');
    bower = (fs.existsSync(bowerPath)) ? require(bowerPath) : {};
  }
  return assign({}, bower['devDependencies'], bower['dependencies']);
};

Project.prototype.buildAddonPackages = function() {
  if (!this.root) { return; }

  var internalMiddlewarePath = path.join(this.root, path.relative(this.root, path.join(__dirname, '../tasks/server/middleware')));

  this.addIfAddon(path.join(internalMiddlewarePath, 'tests-server'));
  this.addIfAddon(path.join(internalMiddlewarePath, 'history-support'));
  this.addIfAddon(path.join(internalMiddlewarePath, 'serve-files'));
  this.addIfAddon(path.join(internalMiddlewarePath, 'proxy-server'));

  if (this.isEmberCLIAddon()) {
    this.addIfAddon(this.root);
  }

  this.discoverAddons(this.root, this.pkg, false);
};

Project.prototype.discoverAddons = function(root, pkg, excludeDevDeps) {
  Object.keys(this.dependencies(pkg, excludeDevDeps)).forEach(function(name) {
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
  debug('attemping to add: %s',  addonPath);

  if (fs.existsSync(pkgPath)) {
    var addonPkg = require(pkgPath);
    var keywords = addonPkg.keywords || [];
    debug(' - module found: %s', addonPkg.name);

    addonPkg['ember-addon'] = addonPkg['ember-addon'] || {};

    if (keywords.indexOf('ember-addon') > -1) {
      debug(' - is addon, adding...');
      this.discoverAddons(addonPath, addonPkg, true);
      this.addonPackages[addonPkg.name] = {
        path: addonPath,
        pkg: addonPkg
      };
    } else {
      debug(' - no ember-addon keyword, not including.');
    }
  }
};

Project.prototype.initializeAddons = function() {
  if (this._addonsInitialized) {
    return;
  }
  this._addonsInitialized = true;

  debug('initializeAddons for: %s', this.name());

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
    if (addon) {
      var AddonConstructor = Addon.lookup(addon);
      project.addons.push(new AddonConstructor(project));
    }
  });

  this.addons.forEach(function(addon) {
    debug('addon: %s', addon.name);
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
  if (this.initializeAddons && this.addonCommands) {
    this.initializeAddons();
    var addonCommands = this.addonCommands();

    forOwn(addonCommands, function(commands, addonName) {
      return callback(addonName, commands);
    });
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
  var addonPaths = this.addons.reverse().map(function(addon) {
    if (addon.blueprintsPath) {
      return addon.blueprintsPath();
    }
  }, this);

  return addonPaths.filter(Boolean);
};

Project.prototype.reloadPkg = function() {
  var pkgPath = path.join(this.root, 'package.json');

  // We use readFileSync instead of require to avoid the require cache.
  this.pkg = JSON.parse(fs.readFileSync(pkgPath, { encoding: 'utf-8' }));

  return this.pkg;
};

Project.prototype.reloadAddons = function() {
  this.reloadPkg();
  this._addonsInitialized = false;
  return this.initializeAddons();
};

Project.prototype.findAddonByName = function(name) {
  this.initializeAddons();

  var exactMatch = find(this.addons, function(addon) {
    return name === addon.name || name === addon.pkg.name;
  });

  if (exactMatch) {
    return exactMatch;
  }

  return find(this.addons, function(addon) {
    return name.indexOf(addon.name) > -1 || name.indexOf(addon.pkg.name) > -1;
  });
};

Project.closest = function(pathName) {
  return closestPackageJSON(pathName)
    .then(function(result) {
      debug('closest %s -> %s', pathName, result);
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

    debug('closestSync %s -> %s', pathName, directory);
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

NotFoundError.prototype = Object.create(Error.prototype);
NotFoundError.prototype.constructor = NotFoundError;

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
