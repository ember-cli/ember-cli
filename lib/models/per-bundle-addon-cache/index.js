'use strict';

const isLazyEngine = require('../../utilities/is-lazy-engine');
const { getAddonProxy } = require('./addon-proxy');
const PROJECT_BUNDLE_HOST_NAME = '__PROJECT__';
const logger = require('heimdalljs-logger')('ember-cli:per-bundle-addon-cache');
const { TARGET_INSTANCE } = require('./target-instance');

/**
 * For large applications with many addons (and many instances of each, resulting in
 * potentially many millions of addon instances during a build), the build can become
 * very, very slow (tens of minutes) partially due to the sheer number of addon instances.
 * The PerBundleAddonCache deals with this slowness by doing 3 things:
 *
 * (1) Making only a single copy of each of certain addons and their dependent addons
 * (2) Replacing any other instances of those addons with Proxy copies to the single instance
 * (3) Having the Proxies return an empty array for their dependent addons, rather
 *     than proxying to the contents of the single addon instance. This gives up the
 *     ability of the Proxies to traverse downward into their child addons,
 *     something that many addons do not do anyway, for the huge reduction in duplications
 *     of those child addons. For applications that enable `ember-engines` dedupe logic,
 *     that logic is stateful, and having the Proxies allow access to the child addons array
 *     just breaks everything, because that logic will try multiple times to remove items
 *     it thinks are duplicated, messing up the single copy of the child addon array.
 *     See the explanation of the dedupe logic in
 *    {@link https://github.com/ember-engines/ember-engines/blob/master/packages/ember-engines/lib/utils/deeply-non-duplicated-addon.js}
 *
 * What follows are the more technical details of how the PerBundleAddonCache implements
 * the above 3 behaviors.
 *
 * This class supports per-bundle-host (bundle host = project or lazy engine)
 * caching of addon instances. During addon initialization we cannot add a
 * cache to each bundle host object AFTER it is instantiated because running the
 * addon constructor ultimately causes Addon class `setupRegistry` code to
 * run which instantiates child addons, which need the cache to already be
 * in place for the parent bundle host.
 * We handle this by providing a global cache that exists independent of the
 * bundle host objects. That is this object.
 *
 * There are a number of "behaviors" being implemented by this object and
 * its contents. They are:
 * (1) Any addon that is a lazy engine has only a single real instance per
 * project - all other references to the lazy engine are to be proxies. These
 * lazy engines are compared by name, not by packageInfo.realPath.
 * (2) Any addon that is not a lazy engine, there is only a single real instance
 * of the addon per "bundle host" (i.e. lazy engine or project).
 * (3) An optimization - any addon that is in a lazy engine but that is also
 * in the project (outside of all lazy engines) - the single instance is the
 * one in the project. All other instances (in any lazy engine) are proxies.
 * NOTE: the optimization is only enabled if the environment variable that controls that
 * ember-engine deduplication (process.env.EMBER_ENGINES_ADDON_DEDUPE) is set
 * to a truthy value.
 *
 * Some implementation details given the above desired behavior:
 * (1) There are actually 2 types of caches in this object:
 * (1a) the first is keyed by lazy engine name. Note: the real instance of
 * the lazy engine is created as it is encountered while traversing the addon
 * tree (just like any real addon instance), it's just also referenced
 * in this cache so we can create proxies to this single instance from
 * anywhere in the addon tree.
 * (2) The cache (one item per lazy engine + project) of real addon instances
 * found while traversing the dependency tree.
 *
 * @public
 * @class PerBundleAddonCache {
 */
class PerBundleAddonCache {
  constructor(project) {
    this.project = project;

    // cache of the addon packageInfos for addons that are descendants of the project
    // (excluding going into lazy engines). Lazy engines that refer to any of these
    // will defer to the project-level one.
    this.bundledProjectAddonPkgInfos = this._setupBundledProjectAddonPackageInfos();

    // The cache of bundle-host instances and their individual addon caches.
    // The cache is keyed by name (since there is only a single instance of any given
    // engine name, even if 2 engine addons have the same engine name).
    // To allow the project in the cache, it will use the empty string for a name,
    // to not collide with any possible engine name.
    // Each cache entry consists of the bundle host instance (Project or Lazy engine)
    // and an addon instance cache to bundle with that bundle host.
    this.bundleHostCache = this._setupBundleHostCache();

    // Indicate if ember-engines deduping is supported.
    this.engineAddonTransitiveDedupeEnabled = !!process.env.EMBER_ENGINES_ADDON_DEDUPE;

    // For stats purposes, counts on the # addons and proxies created. Addons we
    // can compare against the bundleHostCache addon caches. Proxies, not so much,
    // but we'll count them here.
    this.numAddonInstances = 0;
    this.numProxies = 0;
  }

  /**
   * Get the list of addon PackageInfo objects that are a dependency of this project,
   * directly or transitively. Do not check any dependency that is itself a bundle host.
   * This is used as part of the per-bundle addon-caching optimization.
   *
   * @private
   * @method _setupBundledProjectAddonPackageInfos
   * @return {Set} a Set of {PackageInfo} objects.
   */
  _setupBundledProjectAddonPackageInfos() {
    let pkgInfos = new Set();

    let findAddons = (pkgInfo) => {
      if (!pkgInfo.valid || !pkgInfo.addonMainPath) {
        return;
      }

      if (pkgInfos.has(pkgInfo)) {
        return;
      }

      if (pkgInfo.isForBundleHost()) {
        return;
      }

      pkgInfos.add(pkgInfo);

      let addonPackageList = pkgInfo.discoverAddonAddons();
      addonPackageList.forEach((pkgInfo) => findAddons(pkgInfo));
    };

    let addonPackageList = this.project._packageInfo.discoverProjectAddons();
    addonPackageList.forEach((pkgInfo) => findAddons(pkgInfo));

    return pkgInfos;
  }

  /**
   * Set up the cache of bundle host instances. Each entry is keyed by name (project is given
   * the name '__PROJECT__', the lazy engines use their engineName, since those are unique)
   * Each cache entry has the bundle host instance (Project or lazy engine) and the addon instance
   * cache for any addon instances to bundle with that bundle host.
   *
   * @private
   * @method _setupBundleHostCache
   * @return {Map} the bundle-host cache
   */
  _setupBundleHostCache() {
    // get all the lazy engine packageInfos, but only keep the first one
    // with any given engine name.
    let lazyEnginePkgInfos = new Map();

    let findAddons = (pkgInfo) => {
      if (!pkgInfo.valid || !pkgInfo.addonMainPath) {
        return;
      }

      if (pkgInfo.isForLazyEngine()) {
        if (lazyEnginePkgInfos.has(pkgInfo.name)) {
          return;
        }

        lazyEnginePkgInfos.set(pkgInfo.name, pkgInfo);
      }

      let addonPackageList = pkgInfo.discoverAddonAddons();
      addonPackageList.forEach(findAddons);
    };

    let addonPackageList = this.project._packageInfo.discoverProjectAddons();
    addonPackageList.forEach(findAddons);

    // Create the cache
    let cache = new Map();
    cache.set(
      PROJECT_BUNDLE_HOST_NAME,
      this.createBundleHostCacheEntry(this.project, this.project._packageInfo.realPath)
    );

    lazyEnginePkgInfos.forEach((pkgInfo) => {
      cache.set(pkgInfo.name, this.createBundleHostCacheEntry(null, pkgInfo.realPath));
    });

    return cache;
  }

  /**
   * Create a cache entry the bundleHostCache. Because we want to use the same sort of proxy
   * for both bundle hosts and for 'regular' addon instances (though their cache entries have
   * slightly different structures) we'll use the Symbol from getAddonProxy.
   *
   * @method createBundleHostCacheEntry
   * @param {Project|LazyEngine} bundleHostInstance the instance of the Project or lazy engine
   * @param {String} bundleHostRealPath bundle host's pkgInfo.realPath
   * @return {Object} an object in the form of a bundle-host cache entry
   */
  createBundleHostCacheEntry(bundleHostInstance, bundleHostRealPath) {
    return { [TARGET_INSTANCE]: bundleHostInstance, realPath: bundleHostRealPath, addonInstanceCache: new Map() };
  }

  /**
   * Create a cache entry object for a given (non-bundle-host) addon to put into
   * an addon cache.
   *
   * @method createAddonCacheEntry
   * @param {Addon} addonInstance the addon instance to cache
   * @param {String} addonRealPath the addon's pkgInfo.realPath
   * @return {Object} an object in the form of an addon-cache entry
   */
  createAddonCacheEntry(addonInstance, addonRealPath) {
    return { [TARGET_INSTANCE]: addonInstance, realPath: addonRealPath };
  }

  /**
   * Given a parent object of a potential addon (another addon or the project),
   * go up the 'parent' chain to find the potential addon's bundle host object
   * (i.e. lazy engine or project.) Because Projects are always bundle hosts,
   * this should always pass, but we'll throw if somehow it doesn't work.
   *
   * @method findBundleHost
   * @param {Project|Addon} addonParent the direct parent object of a (potential or real) addon.
   * @param {PackageInfo} addonPkgInfo the PackageInfo for an addon being instantiated. This is only
   * used for information if an error is going to be thrown.
   * @return {Object} the object in the 'parent' chain that is a bundle host.
   * @throws {Error} if there is not bundle host
   */
  findBundleHost(addonParent, addonPkgInfo) {
    let curr = addonParent;
    while (curr) {
      if (curr === this.project || isLazyEngine(curr)) {
        return curr;
      }

      curr = curr.parent;
    }

    // the following should not be able to happen given that Projects are always
    // bundle hosts, but just in case, throw an error if we didn't find one.
    throw new Error(`Addon at path\n  ${addonPkgInfo.realPath}\n has 'allowCachingPerBundle' but has no bundleHost`);
  }

  /**
   * An optimization we support from lazy engines is the following:
   * if an addon instance is supposed to be bundled with a particular lazy engine, and
   * same addon is also to be bundled in the project, prefer the one in the project.
   *
   * NOTE: this only applies if this.engineAddonTransitiveDedupeEnabled is truthy. If it is not, the
   * bundle host always "owns" the addon instance.
   *
   * If deduping is enabled and the project does also depend on the same addon,
   * the lazy-engine instances of the addon will all be proxies to the one in
   * the project. This function indicates whether the bundle host passed in (either the
   * project or a lazy engine) is really the bundle host to "own" the new addon.
   *
   * @method bundleHostOwnsInstance
   * @param (Object} bundleHost the project or lazy engine that is trying to "own"
   * the new addon instance specified by addonPkgInfo
   * @param {PackageInfo} addonPkgInfo the PackageInfo of the potential new addon instance
   * @return {Boolean} true if the bundle host is to "own" the instance, false otherwise.
   */
  bundleHostOwnsInstance(bundleHost, addonPkgInfo) {
    return (
      bundleHost === this.project ||
      !this.engineAddonTransitiveDedupeEnabled ||
      !this.bundledProjectAddonPkgInfos.has(addonPkgInfo)
    );
  }

  /**
   * Get the name of a bundle host (used as the key for the bundleHostCache).
   * Projects have a fake name.
   *
   * @method getBundleHostName
   * @param {Project|Addon} bundleHost the bundle host whose name is desired.
   * @return {String} the name of the bundle host
   */
  getBundleHostName(bundleHost) {
    return bundleHost === this.project ? PROJECT_BUNDLE_HOST_NAME : bundleHost.name;
  }

  /**
   * Called from PackageInfo.getAddonInstance(), return an instance of the requested
   * addon or a Proxy, based on the type of addon and its bundle host.
   *
   * @method getAddonInstance
   * @param {Addon|Project} parent the parent Addon or Project this addon instance is
   * a child of.
   * @param {*} addonPkgInfo the PackageInfo for the addon being created.
   * @return {Addon|Proxy} An addon instance (for the first copy of the addon) or a Proxy.
   * An addon that is a lazy engine will only ever have a single copy in the cache.
   * An addon that is not will have 1 copy per bundle host (Project or lazy engine),
   * except if it is an addon that's also owned by the project and
   * is truthy, in which case it will only have a single copy in the project's addon cache.
   */
  getAddonInstance(parent, addonPkgInfo) {
    // If the new addon is itself a bundle host (i.e. lazy engine), there is only one
    // instance of the bundle host, and it's in the entries of the bundleHostCache, outside
    // of the 'regular' addon caches. Because 'setupBundleHostCache' ran during construction,
    // we know that an entry is in the cache with this engine name.
    if (addonPkgInfo.isForBundleHost()) {
      let cacheEntry = this.bundleHostCache.get(addonPkgInfo.name);
      if (cacheEntry[TARGET_INSTANCE]) {
        logger.debug(`About to construct BR PROXY to cache entry for addon at: ${addonPkgInfo.realPath}`);
        this.numProxies++;
        return getAddonProxy(cacheEntry, parent);
      } else {
        // create an instance, put it in the pre-existing cache entry, then
        // return it (as the first instance of the lazy engine.)
        logger.debug(`About to fill in BR EXISTING cache entry for addon at: ${addonPkgInfo.realPath}`);
        this.numAddonInstances++;
        let addon = addonPkgInfo.constructAddonInstance(parent, this.project);
        cacheEntry[TARGET_INSTANCE] = addon; // cache BEFORE initializing child addons
        addonPkgInfo.initChildAddons(addon);
        return addon;
      }
    }

    // We know now we're asking for a 'regular' (non-bundle-host) addon instance.

    let bundleHost = this.findBundleHost(parent, addonPkgInfo);

    // if the bundle host "owns" the new addon instance
    //   * Do we already have an instance of the addon cached?
    //     * If so, make a proxy for it.
    //     * If not, make a new instance of the addon and cache it in the
    //       bundle host's addon cache.
    // If not, it means the bundle host is a lazy engine but the project also uses
    // the addon and deduping is enabled
    //   * If the project already has a cached entry, return a proxy to that
    //   * If it does not, create a 'blank' cache entry and return a proxy to that.
    //     When the addon is encountered later when processing the project's addons,
    //     fill in the instance.
    if (this.bundleHostOwnsInstance(bundleHost, addonPkgInfo)) {
      let bundleHostName = this.getBundleHostName(bundleHost);
      let bundleHostCacheEntry = this.bundleHostCache.get(bundleHostName);
      let addonInstanceCache = bundleHostCacheEntry.addonInstanceCache;
      let addonCacheEntry = addonInstanceCache.get(addonPkgInfo.realPath);
      let addonInstance;

      if (addonCacheEntry) {
        if (addonCacheEntry[TARGET_INSTANCE]) {
          logger.debug(`About to construct REGULAR ADDON PROXY for addon at: ${addonPkgInfo.realPath}`);
          this.numProxies++;
          return getAddonProxy(addonCacheEntry, parent);
        } else {
          // the cache entry was created 'empty' by an earlier call, indicating
          // an addon that is used in a lazy engine but also used in the project,
          // and we're now creating the instance for the project.
          // Fill in the entry and return the new instance.
          logger.debug(`About to fill in REGULAR ADDON EXISTING cache entry for addon at: ${addonPkgInfo.realPath}`);
          this.numAddonInstances++;
          addonInstance = addonPkgInfo.constructAddonInstance(parent, this.project);
          addonCacheEntry[TARGET_INSTANCE] = addonInstance; // cache BEFORE initializing child addons
          addonPkgInfo.initChildAddons(addonInstance);
          return addonInstance;
        }
      }

      // There is no entry for this addon in the bundleHost's addon cache. Create a new
      // instance, cache it in the addon cache, and return it.
      logger.debug(`About to construct REGULAR ADDON NEW cache entry for addon at: ${addonPkgInfo.realPath}`);
      this.numAddonInstances++;
      addonInstance = addonPkgInfo.constructAddonInstance(parent, this.project);
      addonCacheEntry = this.createAddonCacheEntry(addonInstance, addonPkgInfo.realPath);
      addonInstanceCache.set(addonPkgInfo.realPath, addonCacheEntry); // cache BEFORE initializing child addons
      addonPkgInfo.initChildAddons(addonInstance);
      return addonInstance;
    } else {
      // The bundleHost is not the project but the project bundles the addon too and
      // deduping is enabled, so the cache entry needs to go in the project's cache.
      // Get/create an empty cache entry and return a proxy to it. The project will
      // set the instance later (see above).
      let bundleHostCacheEntry = this.bundleHostCache.get(PROJECT_BUNDLE_HOST_NAME);
      let addonCacheEntry = bundleHostCacheEntry.addonInstanceCache.get(addonPkgInfo.realPath);
      if (!addonCacheEntry) {
        logger.debug(`About to construct REGULAR ADDON EMPTY cache entry for addon at: ${addonPkgInfo.realPath}`);
        addonCacheEntry = this.createAddonCacheEntry(null, addonPkgInfo.realPath);
        bundleHostCacheEntry.addonInstanceCache.set(addonPkgInfo.realPath, addonCacheEntry);
      }

      logger.debug(`About to construct REGULAR ADDON PROXY for EMPTY addon at: ${addonPkgInfo.realPath}`);
      this.numProxies++;
      return getAddonProxy(addonCacheEntry, parent);
    }
  }
}

module.exports = PerBundleAddonCache;

// Support for per-bundle addon caching is GLOBAL opt OUT (unless you explicitly set
// EMBER_CLI_ADDON_INSTANCE_CACHING to false, it will be enabled.) If you opt out, that
// overrides setting `allowCachingPerBundle` for any particular addon type to true.
module.exports.SUPPORT_ADDON_INSTANCE_CACHING = process.env.EMBER_CLI_ADDON_INSTANCE_CACHING !== 'false';
