'use strict';

/**
@module ember-cli
*/

const assign = require('ember-cli-lodash-subset').assign;
let logger = require('heimdalljs-logger')('ember-cli:addon-discovery');
const existsSync = require('exists-sync');
const path = require('path');
const resolve = require('resolve');
const findup = require('find-up');
const heimdall = require('heimdalljs');
const PACKAGE_CACHE = Object.create(null);
const AT_PATH_CACHE = Object.create(null);
const FROM_DEPS_CACHE = Object.create(null);
const FROM_IN_REPO_DEPS_CACHE = Object.create(null);
/**
  AddonDiscovery is responsible for collecting information about all of the
  addons that will be used with a project.

  @class AddonDiscovery
  @extends CoreObject
  @constructor
*/
module.exports = class AddonDiscovery {
  constructor(ui) {
    this.ui = ui;
  }

  /**
    This is one of the primary APIs for this class and is called by the project.
    It returns a tree of plain objects that each contain information about a
    discovered addon. Each node has `name`, `path`, `pkg` and
    `childAddons` properties. The latter is an array containing any addons
    discovered from applying the discovery process to that addon.

    @private
    @method discoverProjectAddons
   */
  discoverProjectAddons(project) {
    let token = heimdall.start({
      name: `${project.name()}: addon-discovery`,
      addonDiscoveryNode: true,
    });
    let projectAsAddon = this.discoverFromProjectItself(project);
    let internalAddons = this.discoverFromInternalProjectAddons(project);
    let cliAddons = this.discoverFromCli(project.cli);
    let dependencyAddons;

    if (project.hasDependencies()) {
      dependencyAddons = this.discoverFromDependencies(project.root, project.nodeModulesPath, project.pkg, false);
    } else {
      dependencyAddons = [];
    }

    let inRepoAddons = this.discoverInRepoAddons(project.root, project.pkg);
    let addons = projectAsAddon.concat(cliAddons, internalAddons, dependencyAddons, inRepoAddons);

    token.stop();
    return addons;
  }

  /**
    This is one of the primary APIs for this class and is called by addons.
    It returns a tree of plain objects that each contain information about a
    discovered addon. Each node has `name`, `path`, `pkg` and
    `childAddons` properties. The latter is an array containing any addons
    discovered from applying the discovery process to that addon.

    @private
    @method discoverProjectAddons
  */
  discoverChildAddons(addon) {
    let token = heimdall.start({
      name: `${addon.name}: addon-discovery`,
      addonDiscoveryNode: true,
    });
    logger.info('discoverChildAddons: %s(%s)', addon.name, addon.root);
    let dependencyAddons = this.discoverFromDependencies(addon.root, addon.nodeModulesPath, addon.pkg, true);
    let inRepoAddons = this.discoverInRepoAddons(addon.root, addon.pkg);
    let addons = dependencyAddons.concat(inRepoAddons);

    addons = addons.filter(childAddon => !addon.shouldIncludeChildAddon || addon.shouldIncludeChildAddon(childAddon));

    token.stop();
    return addons;
  }

  /**
    Returns an array containing zero or one nodes, depending on whether or not
    the passed project is an addon.

    @private
    @method discoverFromProjectItself
   */
  discoverFromProjectItself(project) {
    if (project.isEmberCLIAddon()) {
      let addonPkg = this.discoverAtPath(project.root);
      if (addonPkg) {
        return [addonPkg];
      }
    }
    return [];
  }

  /**
    Returns a tree based on the addons referenced in the provided `pkg` through
    the package.json `dependencies` and optionally `devDependencies` collections,
    as well as those discovered addons' child addons.

    @private
    @method discoverFromDependencies
   */
  discoverFromDependencies(root, nodeModulesPath, pkg, excludeDevDeps) {
    let key = `${root}|${nodeModulesPath}|${pkg.name}|${excludeDevDeps}`;
    let entry = FROM_DEPS_CACHE[key];

    if (entry !== undefined) {
      return entry;
    }

    let discovery = this;
    let addons = Object.freeze(Object.keys(this.dependencies(pkg, excludeDevDeps)).map(function(name) {
      if (name !== 'ember-cli') {
        let addonPath = this.resolvePackage(root, name);

        if (addonPath) {
          return discovery.discoverAtPath(addonPath);
        }

        // this supports packages that do not have a valid entry point
        // script (aka `main` entry in `package.json` or `index.js`)
        addonPath = path.join(nodeModulesPath, name);
        let addon = discovery.discoverAtPath(addonPath);
        if (addon) {
          const chalk = require('chalk');

          discovery.ui.writeLine(chalk.yellow(`The package \`${name}\` is not a properly formatted package, we have used a fallback lookup to resolve it at \`${addonPath}\`. This is generally caused by an addon not having a \`main\` entry point (or \`index.js\`).`), 'WARNING');

          return addon;
        }
      }
    }, this).filter(Boolean));

    return (FROM_DEPS_CACHE[key] = addons);
  }

  resolvePackage(root, packageName) {
    let cacheKey = `${packageName}|${root}`;
    let cacheEntry = PACKAGE_CACHE[cacheKey];
    if (cacheEntry) {
      return cacheEntry.path;
    }
    cacheEntry = PACKAGE_CACHE[cacheKey] = { path: null };

    try {
      let entryModulePath = resolve.sync(packageName, { basedir: root });

      let pkgPath = findup.sync('package.json', { cwd: entryModulePath });
      if (pkgPath) {
        return (cacheEntry.path = path.dirname(pkgPath));
      }

    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        return;
      }
      throw e;
    }
  }

  /**
    Returns a tree based on the in-repo addons referenced in the provided `pkg`
    through paths listed in the `ember-addon` entry, as well as those discovered
    addons' child addons.

    @private
    @method discoverInRepoAddons
   */
  discoverInRepoAddons(root, pkg) {
    let key = `${root}|${pkg.name}`;
    let entry = FROM_IN_REPO_DEPS_CACHE[key];
    if (entry !== undefined) {
      return entry;
    }

    if (!pkg || !pkg['ember-addon'] || !pkg['ember-addon'].paths) {
      return (FROM_IN_REPO_DEPS_CACHE[key] = Object.freeze([]));
    }

    let result = Object.freeze(pkg['ember-addon'].paths
      .map(addonPath => this.discoverAtPath(path.join(root, addonPath)))
      .filter(Boolean));

    return (FROM_IN_REPO_DEPS_CACHE[key] = result);
  }

  /**
    Returns a tree based on the internal addons that may be defined within the project.
    It does this by consulting the projects `supportedInternalAddonPaths()` method, which
    is primarily used for middleware addons.

    @private
    @method discoverFromInternalProjectAddons
   */
  discoverFromInternalProjectAddons(project) {
    return project.supportedInternalAddonPaths()
      .map(path => this.discoverAtPath(path))
      .filter(Boolean);
  }

  discoverFromCli(cli) {
    if (!cli) { return []; }

    const cliPkg = require(path.resolve(cli.root, 'package.json'));
    return this.discoverInRepoAddons(cli.root, cliPkg);
  }

  /**
    Given a particular path, return undefined if the path is not an addon, or if it is,
    a node with the info about the addon.

    @private
    @method discoverAtPath
   */
  discoverAtPath(addonPath) {
    let pkgPath = path.join(addonPath, 'package.json');
    let info = AT_PATH_CACHE[pkgPath];
    if (info !== undefined) {
      return info;
    }
    logger.info('attemping to add: %s', addonPath);

    if (existsSync(pkgPath)) {
      let addonPkg = require(pkgPath);
      let keywords = addonPkg.keywords || [];
      logger.info(' - module found: %s', addonPkg.name);

      addonPkg['ember-addon'] = addonPkg['ember-addon'] || {};

      if (keywords.indexOf('ember-addon') > -1) {
        logger.info(' - is addon, adding...');
        let addonInfo = Object.freeze({
          name: addonPkg.name,
          path: addonPath,
          pkg: addonPkg,
        });
        return (AT_PATH_CACHE[pkgPath] = addonInfo);
      } else {
        logger.info(' - no ember-addon keyword, not including.');
      }
    } else {
      logger.info(` - no package.json (looked at ${pkgPath}).`);
    }

    return null;
  }

  /**
    Returns the dependencies from a package.json
    @private
    @method dependencies
    @param  {Object}  pkg            Package object. If false, the current package is used.
    @param  {Boolean} excludeDevDeps Whether or not development dependencies should be excluded, defaults to false.
    @return {Object}                 Dependencies
   */
  dependencies(pkg, excludeDevDeps) {
    pkg = pkg || {};

    let devDependencies = pkg['devDependencies'];
    if (excludeDevDeps) {
      devDependencies = {};
    }

    return assign({}, devDependencies, pkg['dependencies']);
  }

  addonPackages(addonsList) {
    let addonPackages = {};

    addonsList.forEach(addonPkg => {
      addonPackages[addonPkg.name] = addonPkg;
    });

    return addonPackages;
  }
};
