'use strict';

/**
@module ember-cli
*/

var assign     = require('lodash-node/modern/objects/assign');
var debug      = require('debug')('ember-cli:project');
var fs         = require('fs');
var path       = require('path');
var CoreObject = require('core-object');

/**
  AddonDiscovery is responsible for collecting information about all of the
  addons that will be used with a project.

  @class AddonDiscovery
  @extends CoreObject
  @constructor
*/

function AddonDiscovery() {
}
AddonDiscovery.__proto__ = CoreObject;
AddonDiscovery.prototype.constructor = AddonDiscovery;

/**
  This is the primary API for this class and is called by the project.
  It returns a tree of plain objects that contain information about a
  discovered addon. Each node has `name`, `path`, `pkg` and
  `childAddons` properties. The latter is an array containing any addons
  discovered from applying the discovery process to that addon.

  @private
  @method discover
 */
AddonDiscovery.prototype.discover = function(project) {
  var projectAsAddon = this.discoverFromProjectItself(project);
  var internalAddons = this.discoverFromInternalProjectAddons(project);
  var dependencyAddons = this.discoverFromDependencies(project.root, project.pkg, false);
  var inRepoAddons = this.discoverInRepoAddons(project.root, project.pkg);
  var addons = projectAsAddon.concat(internalAddons, dependencyAddons, inRepoAddons);
  return addons;
};

/**
  Returns an array containing zero or one nodes, depending on whether or not
  the passed project is an addon.

  @private
  @method discoverFromProjectItself
 */
AddonDiscovery.prototype.discoverFromProjectItself = function(project) {
  if (project.isEmberCLIAddon()) {
    var addonPkg = this.discoverAtPath(this.root, false);
    if (addonPkg) {
      return [addonPkg];
    }
  }
  return [];
};

/**
  Returns a tree based on the addons referenced in the provided `pkg` through
  the package.json `dependencies` and optionally `devDependencies` collections,
  as well as those discovered addons' child addons.

  @private
  @method discoverFromDependencies
 */
AddonDiscovery.prototype.discoverFromDependencies = function(root, pkg, excludeDevDeps) {
  var discovery = this;
  var addons = Object.keys(this.dependencies(pkg, excludeDevDeps)).map(function(name) {
    if (name !== 'ember-cli') {
      var addonPath = path.join(root, 'node_modules', name);
      return discovery.discoverAtPath(addonPath, true);
    }
  }, this).filter(Boolean);
  return addons;
};

/**
  Returns a tree based on the in-repo addons referenced in the provided `pkg`
  through paths listed in the `ember-addon` entry, as well as those discovered
  addons' child addons.

  @private
  @method discoverInRepoAddons
 */
AddonDiscovery.prototype.discoverInRepoAddons = function(root, pkg) {
  if (!pkg['ember-addon'] || !pkg['ember-addon'].paths) {
    return [];
  }
  var discovery = this;
  var addons = pkg['ember-addon'].paths.map(function(addonPath) {
    addonPath = path.join(root, addonPath);
    return discovery.discoverAtPath(addonPath, true);
  }, this).filter(Boolean);
  return addons;
};

/**
  Returns a tree based on the internal addons that may be defined within the project.
  It does this by consulting the projects `supportedInternalAddonPaths()` method, which
  is primarily used for middleware addons.

  @private
  @method discoverFromInternalProjectAddons
 */
AddonDiscovery.prototype.discoverFromInternalProjectAddons = function(project) {
  var discovery = this;
  return project.supportedInternalAddonPaths().map(function(path){
    return discovery.discoverAtPath(path, true);
  }).filter(Boolean);
};

/**
  Given a particular path, return undefined if the path is not an addon, or it it is,
  a node with the info about the addon, and, if `discoverChildAddons` is true, any
  child addons.

  @private
  @method discoverAtPath
 */
AddonDiscovery.prototype.discoverAtPath = function(addonPath, discoverChildAddons) {
  var pkgPath = path.join(addonPath, 'package.json');
  debug('attemping to add: %s',  addonPath);

  if (fs.existsSync(pkgPath)) {
    var addonPkg = require(pkgPath);
    var keywords = addonPkg.keywords || [];
    debug(' - module found: %s', addonPkg.name);

    addonPkg['ember-addon'] = addonPkg['ember-addon'] || {};

    if (keywords.indexOf('ember-addon') > -1) {
      debug(' - is addon, adding...');
      var addonInfo = {
        name: addonPkg.name,
        path: addonPath,
        pkg: addonPkg,
      };
      addonInfo.childAddons = discoverChildAddons ? this.discoverChildAddons(addonInfo) : [];
      return addonInfo;
    } else {
      debug(' - no ember-addon keyword, not including.');
    }
  }
};

/**
  Find child addons of the provided "addonInfo" by checking dependencies and in-repo addons.

  @private
  @method discoverChildAddons
 */
AddonDiscovery.prototype.discoverChildAddons = function(addonInfo) {
  var dependencyAddons = this.discoverFromDependencies(addonInfo.path, addonInfo.pkg, true);
  var inRepoAddons = this.discoverInRepoAddons(addonInfo.path, addonInfo.pkg);
  var addons = dependencyAddons.concat(inRepoAddons);
  return addons;
};

/**
  Returns the dependencies from a package.json

  @private
  @method dependencies
  @param  {Object}  pkg            Package object. If false, the current package is used.
  @param  {Boolean} excludeDevDeps Whether or not development dependencies should be excluded, defaults to false.
  @return {Object}                 Dependencies
 */
AddonDiscovery.prototype.dependencies = function(pkg, excludeDevDeps) {
  pkg = pkg || {};

  var devDependencies = pkg['devDependencies'];
  if (excludeDevDeps) {
    devDependencies = {};
  }

  return assign({}, devDependencies, pkg['dependencies']);
};


// Export
module.exports = AddonDiscovery;
