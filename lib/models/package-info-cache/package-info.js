'use strict';

const path = require('path');
const ErrorList = require('./error-list');
const Errors = require('./errors');
const AddonInfo = require('../addon-info');
const isAddon = require('../../utilities/is-addon');
const isEngine = require('../../utilities/is-engine');
const isLazyEngine = require('../../utilities/is-lazy-engine');
const logger = require('heimdalljs-logger')('ember-cli:package-info-cache:package-info');
const PerBundleAddonCache = require('../per-bundle-addon-cache');

function lexicographically(a, b) {
  const aIsString = typeof a.name === 'string';
  const bIsString = typeof b.name === 'string';

  if (aIsString && bIsString) {
    return a.name.localeCompare(b.name);
  } else if (aIsString) {
    return -1;
  } else if (bIsString) {
    return 1;
  } else {
    return 0;
  }
}

function pushUnique(array, entry) {
  const index = array.indexOf(entry);

  if (index > -1) {
    // the entry already exists in the array, but since the presedence between
    // addons is "last right wins". We first remove the duplicate entry, and
    // append it to the end of the array.
    array.splice(index, 1);
  }

  // At this point, the entry is not in the array. So we must append it.
  array.push(entry);

  // All this ensures:
  // pushUnique([a1,a2,a3], a1)
  // results in:
  //
  // [a2, a3, a1]
  //
  // which results in the most "least surprising" addon ordering.
}

/**
 * Class that stores information about a single package (directory tree with
 * a package.json and other data, like and Addon or Project.) It is one of the
 * two types of entries in a PackageInfoCache. It is only created by the
 * PackageInfoCache.
 *
 * @public
 * @class PackageInfo
 */
class PackageInfo {
  constructor(pkgObj, realPath, cache, isRoot = false) {
    this.pkg = pkgObj;
    this.pkg['ember-addon'] = this.pkg['ember-addon'] || {};
    this.realPath = realPath;
    this.cache = cache;
    this.errors = new ErrorList();

    // other fields that will be set as needed. For JIT we'll define
    // them here.
    this.addonMainPath = undefined; // addons only
    this.inRepoAddons = undefined; // (list of PackageInfo - both)
    this.internalAddons = undefined; // (list of PackageInfo - project only)
    this.cliInfo = undefined; // (PackageInfo - project only)
    this.dependencyPackages = undefined; // (obj keyed by dependency name: PackageInfo)
    // NOTE: ALL dependencies, not just addons
    this.devDependencyPackages = undefined; // (obj keyed by devDependency name: PackageInfo)
    // NOTE: these are ALL dependencies, not just addons
    this.nodeModules = undefined; // (NodeModulesList, set only if pkg contains node_modules)

    // flag indicating that the packageInfo is considered valid. This will
    // be true as long as we have a valid directory and our package.json file
    // is okay and, if we're an ember addon, that we have a valid 'main' file.
    // Missing dependencies will not be considered an error, since they may
    // not actually be used.
    this.valid = true;

    this.mayHaveAddons = isRoot || this.isForAddon(); // mayHaveAddons used in index.js

    this._hasDumpedInvalidAddonPackages = false;
  }

  // Make various fields of the pkg object available.
  get name() {
    return this.pkg.name;
  }

  /**
   * Given error data, add an ErrorEntry to the ErrorList for this object.
   * This is used by the _readPackage and _readNodeModulesList methods. It
   * should not be called otherwise.
   *
   * @protected
   * @method addError
   * @param {String} errorType one of the Errors.ERROR_* constants.
   * @param {Object} errorData any error data relevant to the type of error
   * being created. See showErrors().
   */
  addError(errorType, errorData) {
    this.errors.addError(errorType, errorData);
  }

  /**
   * Indicate if there are any errors in the ErrorList for this package. Note that this does
   * NOT indicate if there are any errors in the objects referred to by this package (e.g.,
   * internal addons or dependencies).
   *
   * @public
   * @method hasErrors
   * @param {boolean} true if there are errors in the ErrorList, else false.
   */
  hasErrors() {
    return this.errors.hasErrors();
  }

  /**
   * Add a reference to an in-repo addon PackageInfo object.
   *
   * @protected
   * @method addInRepoAddon
   * @param {PackageInfo} inRepoAddonPkg the PackageInfo for the in-repo addon
   * @return null
   */
  addInRepoAddon(inRepoAddonPkg) {
    if (!this.inRepoAddons) {
      this.inRepoAddons = [];
    }
    this.inRepoAddons.push(inRepoAddonPkg);
  }

  /**
   * Add a reference to an internal addon PackageInfo object.
   * "internal" addons (note: not in-repo addons) only exist in
   * Projects, not other packages. Since the cache is loaded from
   * 'loadProject', this can be done appropriately.
   *
   * @protected
   * @method addInternalAddon
   * @param {PackageInfo} internalAddonPkg the PackageInfo for the internal addon
   * @return null
   */
  addInternalAddon(internalAddonPkg) {
    if (!this.internalAddons) {
      this.internalAddons = [];
    }
    this.internalAddons.push(internalAddonPkg);
  }

  /**
   * For each dependency in the given list, find the corresponding
   * PackageInfo object in the cache (going up the file tree if
   * necessary, as in the node resolution algorithm). Return a map
   * of the dependencyName to PackageInfo object. Caller can then
   * store it wherever they like.
   *
   * Note: this is not to be  called until all packages that can be have
   * been added to the cache.
   *
   * Note: this is for ALL dependencies, not just addons. To get just
   * addons, filter the result by calling pkgInfo.isForAddon().
   *
   * Note: this is only intended for use from PackageInfoCache._resolveDependencies.
   * It is not to be called directly by anything else.
   *
   * @protected
   * @method addDependencies
   * @param {PackageInfo} dependencies value of 'dependencies' or 'devDependencies'
   *        attributes of a package.json.
   * @return {Object} a JavaScript object keyed on dependency name/path with
   *    values the corresponding PackageInfo object from the cache.
   */
  addDependencies(dependencies) {
    if (!dependencies) {
      return null;
    }

    let dependencyNames = Object.keys(dependencies);

    if (dependencyNames.length === 0) {
      return null;
    }

    let packages = Object.create(null);

    let missingDependencies = [];

    dependencyNames.forEach((dependencyName) => {
      logger.info('%s: Trying to find dependency %o', this.pkg.name, dependencyName);

      let dependencyPackage;

      // much of the time the package will have dependencies in
      // a node_modules inside it, so check there first because it's
      // quicker since we have the reference. Only check externally
      // if we don't find it there.
      if (this.nodeModules) {
        dependencyPackage = this.nodeModules.findPackage(dependencyName);
      }

      if (!dependencyPackage) {
        dependencyPackage = this.cache._findPackage(dependencyName, path.dirname(this.realPath));
      }

      if (dependencyPackage) {
        packages[dependencyName] = dependencyPackage;
      } else {
        missingDependencies.push(dependencyName);
      }
    });

    if (missingDependencies.length > 0) {
      this.addError(Errors.ERROR_DEPENDENCIES_MISSING, missingDependencies);
    }

    return packages;
  }

  /**
   * Indicate if this packageInfo is for a project. Should be called only after the project
   * has been loaded (see {@link PackageInfoCache#loadProject} for details).
   *
   * @method isForProject
   * @return {Boolean} true if this packageInfo is for a Project, false otherwise.
   */
  isForProject() {
    return !!this.project && this.project.isEmberCLIProject && this.project.isEmberCLIProject();
  }

  /**
   * Indicate if this packageInfo is for an Addon.
   *
   * @method isForAddon
   * @return {Boolean} true if this packageInfo is for an Addon, false otherwise.
   */
  isForAddon() {
    return isAddon(this.pkg.keywords);
  }

  /**
   * Indicate if this packageInfo represents an engine.
   *
   * @method isForEngine
   * @return {Boolean} true if this pkgInfo is configured as an engine & false otherwise
   */
  isForEngine() {
    return isEngine(this.pkg.keywords);
  }

  /**
   * Indicate if this packageInfo represents a lazy engine.
   *
   * @method isForLazyEngine
   * @return {Boolean} true if this pkgInfo is configured as an engine and the
   * module this represents has lazyLoading enabled, false otherwise.
   */
  isForLazyEngine() {
    return this.isForEngine() && isLazyEngine(this._getAddonEntryPoint());
  }

  /**
   * For use with the PerBundleAddonCache, is this packageInfo representing a
   * bundle host (for now, a Project or a lazy engine).
   *
   * @method isForBundleHost
   * @return {Boolean} true if this pkgInfo is for a bundle host, false otherwise.
   */
  isForBundleHost() {
    return this.isForProject() || this.isForLazyEngine();
  }

  /**
   * Add to a list of child addon PackageInfos for this packageInfo.
   *
   * @method addPackages
   * @param {Array} addonPackageList the list of child addon PackageInfos being constructed from various
   * sources in this packageInfo.
   * @param {Array | Object} packageInfoList a list or map of PackageInfos being considered
   * (e.g., pkgInfo.dependencyPackages) for inclusion in the addonPackageList.
   * @param {Function} excludeFn an optional function. If passed in, each child PackageInfo
   * will be tested against the function and only included in the package map if the function
   * returns a truthy value.
   */
  addPackages(addonPackageList, packageInfoList, excludeFn) {
    if (!packageInfoList) {
      return;
    }

    let result = [];
    if (Array.isArray(packageInfoList)) {
      if (excludeFn) {
        packageInfoList = packageInfoList.filter((pkgInfo) => !excludeFn(pkgInfo));
      }

      packageInfoList.forEach((pkgInfo) => result.push(pkgInfo));
    } else {
      // We're going to assume we have a map of name to packageInfo
      Object.keys(packageInfoList).forEach((name) => {
        let pkgInfo = packageInfoList[name];
        if (!excludeFn || !excludeFn(pkgInfo)) {
          result.push(pkgInfo);
        }
      });
    }

    result.sort(lexicographically).forEach((pkgInfo) => pushUnique(addonPackageList, pkgInfo));

    return addonPackageList;
  }

  /**
   * Discover the child addons for this packageInfo, which corresponds to an Addon.
   *
   * @method discoverAddonAddons
   */
  discoverAddonAddons() {
    let addonPackageList = [];

    this.addPackages(
      addonPackageList,
      this.dependencyPackages,
      (pkgInfo) => !pkgInfo.isForAddon() || pkgInfo.name === 'ember-cli'
    );
    this.addPackages(addonPackageList, this.inRepoAddons);

    return addonPackageList;
  }

  /**
   * Discover the child addons for this packageInfo, which corresponds to a Project.
   *
   * @method discoverProjectAddons
   */
  discoverProjectAddons() {
    let project = this.project;

    let addonPackageList = [];

    this.addPackages(addonPackageList, project.isEmberCLIAddon() ? [this] : null);
    this.addPackages(addonPackageList, this.cliInfo ? this.cliInfo.inRepoAddons : null);
    this.addPackages(addonPackageList, this.internalAddons);
    this.addPackages(addonPackageList, this.devDependencyPackages, (pkgInfo) => !pkgInfo.isForAddon());
    this.addPackages(addonPackageList, this.dependencyPackages, (pkgInfo) => !pkgInfo.isForAddon());
    this.addPackages(addonPackageList, this.inRepoAddons);

    return addonPackageList;
  }

  /**
   * Given a list of PackageInfo objects, generate the 'addonPackages' object (keyed by
   * name, value = AddonInfo instance, for all packages marked 'valid'). This is stored in
   * both Addon and Project instances.
   *
   * @method generateAddonPackages
   * @param {Array} addonPackageList the list of child addon PackageInfos to work from
   * @param {Function} excludeFn an optional function. If passed in, each child PackageInfo
   * will be tested against the function and only included in the package map if the function
   * returns a truthy value.
   */
  generateAddonPackages(addonPackageList, excludeFn) {
    let validPackages = this.getValidPackages(addonPackageList);

    let packageMap = Object.create(null);

    validPackages.forEach((pkgInfo) => {
      let addonInfo = new AddonInfo(pkgInfo.name, pkgInfo.realPath, pkgInfo.pkg);
      if (!excludeFn || !excludeFn(addonInfo)) {
        packageMap[pkgInfo.name] = addonInfo;
      }
    });

    return packageMap;
  }

  getValidPackages(addonPackageList) {
    return addonPackageList.filter((pkgInfo) => pkgInfo.valid);
  }

  getInvalidPackages(addonPackageList) {
    return addonPackageList.filter((pkgInfo) => !pkgInfo.valid);
  }

  dumpInvalidAddonPackages(addonPackageList) {
    if (this._hasDumpedInvalidAddonPackages) {
      return;
    }
    this._hasDumpedInvalidAddonPackages = true;

    let invalidPackages = this.getInvalidPackages(addonPackageList);

    if (invalidPackages.length > 0) {
      let typeName = this.project ? 'project' : 'addon';

      let msg = `The 'package.json' file for the ${typeName} at ${this.realPath}`;

      let relativePath;
      if (invalidPackages.length === 1) {
        relativePath = path.relative(this.realPath, invalidPackages[0].realPath);
        msg = `${msg}\n  specifies an invalid, malformed or missing addon at relative path '${relativePath}'`;
      } else {
        msg = `${msg}\n  specifies invalid, malformed or missing addons at relative paths`;
        invalidPackages.forEach((packageInfo) => {
          let relativePath = path.relative(this.realPath, packageInfo.realPath);
          msg = `${msg}\n    '${relativePath}'`;
        });
      }

      throw msg;
    }
  }

  /**
   * This is only supposed to be called by the addon instantiation code.
   * Also, the assumption here is that this PackageInfo really is for an
   * Addon, so we don't need to check each time.
   *
   * @private
   * @method getAddonConstructor
   * @return {AddonConstructor} an instance of a constructor function for the Addon class
   * whose package information is stored in this object.
   */
  getAddonConstructor() {
    if (this.addonConstructor) {
      return this.addonConstructor;
    }

    let module = this._getAddonEntryPoint();
    let mainDir = path.dirname(this.addonMainPath);

    let ctor;

    if (typeof module === 'function') {
      ctor = module;
      ctor.prototype.root = ctor.prototype.root || mainDir;
      ctor.prototype.packageRoot = ctor.prototype.packageRoot || this.realPath;
      ctor.prototype.pkg = ctor.prototype.pkg || this.pkg;
    } else {
      const Addon = require('../addon'); // done here because of circular dependency

      ctor = Addon.extend(Object.assign({ root: mainDir, packageRoot: this.realPath, pkg: this.pkg }, module));
    }

    ctor._meta_ = {
      modulePath: this.addonMainPath,
    };

    return (this.addonConstructor = ctor);
  }

  /**
   * Construct an addon instance.
   *
   * NOTE: this does NOT call constructors for the child addons. That is left to
   * the caller to do, so they can insert any other logic they want.
   *
   * @private
   * @method constructAddonInstance
   * @param {Project|Addon} parent the parent that directly contains this addon
   * @param {Project} project the project that is/contains this addon
   */
  constructAddonInstance(parent, project) {
    let start = Date.now();

    let AddonConstructor = this.getAddonConstructor();

    let addonInstance;

    try {
      addonInstance = new AddonConstructor(parent, project);
    } catch (e) {
      if (parent && parent.ui) {
        parent.ui.writeError(e);
      }

      const SilentError = require('silent-error');
      throw new SilentError(`An error occurred in the constructor for ${this.name} at ${this.realPath}`);
    }

    AddonConstructor._meta_.initializeIn = Date.now() - start;
    addonInstance.constructor = AddonConstructor;

    return addonInstance;
  }

  /**
   * Create an instance of the addon represented by this packageInfo or (if we
   * are supporting per-bundle caching and this is an allow-caching-per-bundle addon)
   * check if we should be creating a proxy instead.
   *
   * NOTE: we assume that the value of 'allowCachingPerBundle' does not change between
   * calls to the constructor! A given addon is either allowing or not allowing caching
   * for an entire run.
   *
   * @method getAddonInstance
   * @param {} parent the addon/project that is to be the direct parent of the
   * addon instance created here
   * @param {*} project the project that is to contain this addon instance
   * @return {Object} the constructed instance of the addon
   */
  getAddonInstance(parent, project) {
    let addonEntryPointModule = this._getAddonEntryPoint();
    let addonInstance;

    if (
      PerBundleAddonCache.isEnabled() &&
      project &&
      project.perBundleAddonCache.allowCachingPerBundle(addonEntryPointModule)
    ) {
      addonInstance = project.perBundleAddonCache.getAddonInstance(parent, this);
    } else {
      addonInstance = this.constructAddonInstance(parent, project);
      this.initChildAddons(addonInstance);
    }

    return addonInstance;
  }

  /**
   * Initialize the child addons array of a newly-created addon instance. Normally when
   * an addon derives from Addon, child addons will be created during 'setupRegistry' and
   * this code is essentially unnecessary. But if an addon is created with custom constructors
   * that don't call 'setupRegistry', any child addons may not yet be initialized.
   *
   * @method initChildAddons
   * @param {Addon} addonInstance
   */
  initChildAddons(addonInstance) {
    if (addonInstance.initializeAddons) {
      addonInstance.initializeAddons();
    } else {
      addonInstance.addons = [];
    }
  }

  /**
   * Gets the addon entry point
   *
   * @method _getAddonEntryPoint
   * @return {Object|Function} The exported addon entry point
   * @private
   */
  _getAddonEntryPoint() {
    if (!this.addonMainPath) {
      throw new Error(`${this.pkg.name} at ${this.realPath} is missing its addon main file`);
    }

    // Load the addon.
    // TODO: Future work - allow a time budget for loading each addon and warn
    // or error for those that take too long.
    return require(this.addonMainPath);
  }
}

module.exports = PackageInfo;
module.exports.lexicographically = lexicographically;
module.exports.pushUnique = pushUnique;
