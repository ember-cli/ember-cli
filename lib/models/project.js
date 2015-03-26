'use strict';

/**
@module ember-cli
*/
var Promise         = require('../ext/promise');
var path            = require('path');
var findup          = Promise.denodeify(require('findup'));
var resolve         = Promise.denodeify(require('resolve'));
var fs              = require('fs');
var assign          = require('lodash-node/modern/objects/assign');
var find            = require('lodash-node/modern/collections/find');
var merge           = require('lodash-node/modern/objects/merge');
var forOwn          = require('lodash-node/modern/objects/forOwn');
var debug           = require('debug')('ember-cli:project');
var AddonDiscovery  = require('../models/addon-discovery');
var AddonsFactory   = require('../models/addons-factory');
var Command         = require('../models/command');
var UI              = require('../ui');

var versionUtils    = require('../utilities/version-utils');
var emberCLIVersion = versionUtils.emberCLIVersion;

/**
  The Project model is tied to your package.json. It is instiantiated
  by giving Project.closest the path to your project.

  @class Project
  @constructor
  @param {String} root Root directory for the project
  @param {Object} pkg  Contents of package.json
*/
function Project(root, pkg, ui) {
  debug('init root: %s', root);
  this.root          = root;
  this.pkg           = pkg;
  this.ui            = ui;
  this.addonPackages = {};
  this.addons = [];
  this.liveReloadFilterPatterns = [];
  this.setupBowerDirectory();
  this.addonDiscovery = new AddonDiscovery(this.ui);
  this.addonsFactory = new AddonsFactory(this, this);
}

/**
  Sets the name of the bower directory for this project

  @private
  @method setupBowerDirectory
 */
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

/**
  Returns the name from package.json.

  @private
  @method name
  @return {String} Package name
 */
Project.prototype.name = function() {
  return this.pkg.name;
};

/**
  Returns whether or not this is an Ember CLI project.
  This checks whether ember-cli is listed in devDependencies.

  @private
  @method isEmberCLIProject
  @return {Boolean} Whether this is an Ember CLI project
 */
Project.prototype.isEmberCLIProject = function() {
  return this.pkg.devDependencies && 'ember-cli' in this.pkg.devDependencies;
};

/**
  Returns whether or not this is an Ember CLI addon.

  @method isEmberCLIAddon
  @return {Boolean} Whether or not this is an Ember CLI Addon.
 */
Project.prototype.isEmberCLIAddon = function() {
  return !!this.pkg.keywords && this.pkg.keywords.indexOf('ember-addon') > -1;
};

/**
  Returns the path to the configuration.

  @private
  @method configPath
  @return {String} Configuration path
 */
Project.prototype.configPath = function() {
  var configPath = 'config';

  if (this.pkg['ember-addon'] && this.pkg['ember-addon']['configPath']) {
    configPath = this.pkg['ember-addon']['configPath'];
  }

  return path.join(configPath, 'environment');
};

/**
  Loads the configuration for this project and its addons.

  @private
  @method config
  @param  {String} env Environment name
  @return {Object}     Merged confiration object
 */
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

/**
  Returns the addons configuration.

  @private
  @method getAddonsConfig
  @param  {String} env       Environment name
  @param  {Object} appConfig Application configuration
  @return {Object}           Merged configuration of all addons
 */
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

/**
  Returns whether or not the given file name is present in this project.

  @private
  @method has
  @param  {String}  file File name
  @return {Boolean}      Whether or not the file is present
 */
Project.prototype.has = function(file) {
  return fs.existsSync(path.join(this.root, file)) || fs.existsSync(path.join(this.root, file + '.js'));
};

/**
  Resolves the absolute path to a file.

  @private
  @method resolve
  @param  {String} file File to resolve
  @return {String}      Absolute path to file
 */
Project.prototype.resolve = function(file) {
  return resolve(file, {
    basedir: this.root
  });
};

/**
  Calls `require` on a given module.

  @private
  @method require
  @param  {String} file File path or module name
  @return {Object}      Imported module
 */
Project.prototype.require = function(file) {
  if (/^\.\//.test(file)) { // Starts with ./
    return require(path.join(this.root, file));
  } else {
    return require(path.join(this.root, 'node_modules', file));
  }
};


Project.prototype.emberCLIVersion = emberCLIVersion;

/**
  Returns the dependencies from a package.json

  @private
  @method dependencies
  @param  {Object}  pkg            Package object. If false, the current package is used.
  @param  {Boolean} excludeDevDeps Whether or not development dependencies should be excluded, defaults to false.
  @return {Object}                 Dependencies
 */
Project.prototype.dependencies = function(pkg, excludeDevDeps) {
  pkg = pkg || this.pkg || {};

  var devDependencies = pkg['devDependencies'];
  if (excludeDevDeps) {
    devDependencies = {};
  }

  return assign({}, devDependencies, pkg['dependencies']);
};

/**
  Returns the bower dependencies for this project.

  @private
  @method bowerDependencies
  @param  {String} bower Path to bower.json
  @return {Object}       Bower dependencies
 */
Project.prototype.bowerDependencies = function(bower) {
  if (!bower) {
    var bowerPath = path.join(this.root, 'bower.json');
    bower = (fs.existsSync(bowerPath)) ? require(bowerPath) : {};
  }
  return assign({}, bower['devDependencies'], bower['dependencies']);
};

/**
  Provides the list of paths to consult for addons that may be provided
  internally to this project. Used for middleware addons with built-in support.

  @private
  @method supportedInternalAddonPaths
*/
Project.prototype.supportedInternalAddonPaths = function(){
  if (!this.root) { return []; }

  var internalMiddlewarePath = path.join(this.root, path.relative(this.root, path.join(__dirname, '../tasks/server/middleware')));
  var internalDiagnosticPath = path.join(this.root, path.relative(this.root, path.join(__dirname, '../tasks/doctor/')));

  return [
    path.join(internalMiddlewarePath, 'tests-server'),
    path.join(internalMiddlewarePath, 'history-support'),
    path.join(internalMiddlewarePath, 'serve-files'),
    path.join(internalMiddlewarePath, 'proxy-server'),
    path.join(internalDiagnosticPath, 'check-npm-outdated'),
    path.join(internalDiagnosticPath, 'check-versions')
  ];
};

/**
  Discovers all addons for this project and stores their names and
  package.json contents in this.addonPackages as key-value pairs

  @private
  @method discoverAddons
 */
Project.prototype.discoverAddons = function() {
  var addonsList = this.addonDiscovery.discoverProjectAddons(this);

  var addonPackages = {};
  addonsList.forEach(function(addonPkg) {
    addonPackages[addonPkg.name] = addonPkg;
  });
  this.addonPackages = addonPackages;
};

/**
  Loads and initializes all addons for this project.

  @private
  @method initializeAddons
 */
Project.prototype.initializeAddons = function() {
  if (this._addonsInitialized) {
    return;
  }
  this._addonsInitialized = true;

  debug('initializeAddons for: %s', this.name());

  this.discoverAddons();
  this.addons = this.addonsFactory.initializeAddons(this.addonPackages);

  this.addons.forEach(function(addon) {
    debug('addon: %s', addon.name);
  });
};

/**
  Returns what commands are made available by addons by inspecting
  `includedCommands` for every addon.

  @private
  @method addonCommands
  @return {Object} Addon names and command maps as key-value pairs
 */
Project.prototype.addonCommands = function() {
  var commands = {};
  this.addons.forEach(function(addon){
    var includedCommands = (addon.includedCommands && addon.includedCommands()) || {};
    var addonCommands = {};

    for (var key in includedCommands) {
      if (typeof includedCommands[key] === 'function') {
        addonCommands[key] = includedCommands[key];
      } else {
        addonCommands[key] = Command.extend(includedCommands[key]);
      }
    }
    if(Object.keys(addonCommands).length) {
      commands[addon.name] = addonCommands;
    }
  });
  return commands;
};

/**
  Execute a given callback for every addon command.
  Example:

  ```
  project.eachAddonCommand(function(addonName, commands) {
    console.log('Addon ' + addonName + ' exported the following commands:' + commands.keys().join(', '));
  });
  ```

  @private
  @method eachAddonCommand
  @param  {Function} callback [description]
 */
Project.prototype.eachAddonCommand = function(callback) {
  if (this.initializeAddons && this.addonCommands) {
    this.initializeAddons();
    var addonCommands = this.addonCommands();

    forOwn(addonCommands, function(commands, addonName) {
      return callback(addonName, commands);
    });
  }
};

/**
  Path to the blueprints for this project.

  @private
  @method localBlueprintLookupPath
  @return {String} Path to blueprints
 */
Project.prototype.localBlueprintLookupPath = function() {
  return path.join(this.root, 'blueprints');
};

/**
  Returns a list of paths (including addon paths) where blueprints will be looked up.

  @private
  @method blueprintLookupPaths
  @return {Array} List of paths
 */
Project.prototype.blueprintLookupPaths = function() {
  if (this.isEmberCLIProject()) {
    var lookupPaths = [this.localBlueprintLookupPath()];
    var addonLookupPaths = this.addonBlueprintLookupPaths();

    return lookupPaths.concat(addonLookupPaths);
  } else {
    return [];
  }
};

/**
  Returns a list of addon paths where blueprints will be looked up.

  @private
  @method addonBlueprintLookupPaths
  @return {Array} List of paths
 */
Project.prototype.addonBlueprintLookupPaths = function() {
  var addonPaths = this.addons.map(function(addon) {
    if (addon.blueprintsPath) {
      return addon.blueprintsPath();
    }
  }, this);

  return addonPaths.filter(Boolean).reverse();
};

/**
  Reloads package.json

  @private
  @method reloadPkg
  @return {Object} Package content
 */
Project.prototype.reloadPkg = function() {
  var pkgPath = path.join(this.root, 'package.json');

  // We use readFileSync instead of require to avoid the require cache.
  this.pkg = JSON.parse(fs.readFileSync(pkgPath, { encoding: 'utf-8' }));

  return this.pkg;
};

/**
  Re-initializes addons.

  @private
  @method reloadAddons
 */
Project.prototype.reloadAddons = function() {
  this.reloadPkg();
  this._addonsInitialized = false;
  return this.initializeAddons();
};

/**
  Find an addon by its name

  @private
  @method findAddonByName
  @param  {String} name Addon name as specified in package.json
  @return {Addon}       Addon instance
 */
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

/**
  Returns a new project based on the first package.json that is found
  in `pathName`.

  @private
  @static
  @method closest
  @param  {String} pathName Path to your project
  @return {Promise}         Promise which resolves to a {Project}
 */
Project.closest = function(pathName, _ui) {
  var ui = ensureUI(_ui);

  return closestPackageJSON(pathName)
    .then(function(result) {
      debug('closest %s -> %s', pathName, result);
      if (result.pkg && result.pkg.name === 'ember-cli') {
        return NULL_PROJECT;
      }

      return new Project(result.directory, result.pkg, ui);
    })
    .catch(function(reason) {
      handleFindupError(pathName, reason);
    });
};

/**
  Returns a new project based on the first package.json that is found
  in `pathName`.

  @private
  @static
  @method closestSync
  @param  {String} pathName Path to your project
  @param  {UI} ui The UI instance to provide to the created Project.
  @return {Project}         Project instance
 */
Project.closestSync = function(pathName, _ui) {
  var ui = ensureUI(_ui);

  try {
    var directory = findup.sync(pathName, 'package.json');
    var pkg = require(path.join(directory, 'package.json'));

    if (pkg && pkg.name === 'ember-cli') {
      return NULL_PROJECT;
    }

    debug('closestSync %s -> %s', pathName, directory);
    return new Project(directory, pkg, ui);
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

function ensureUI(_ui) {
  var ui = _ui;

  if (!ui) {
    // TODO: one UI (lib/cli/index.js also has one for now...)
    ui = new UI({
      inputStream:  process.stdin,
      outputStream: process.stdout,
      ci:           process.env.CI || /^(dumb|emacs)$/.test(process.env.TERM),
      writeLevel:   ~process.argv.indexOf('--silent') ? 'ERROR' : undefined
    });
  }

  return ui;
}

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
