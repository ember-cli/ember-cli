'use strict';

const fs = require('fs');
const path = require('path');
const isLazyEngine = require('../../utilities/is-lazy-engine');
const { getAddonProxy } = require('./addon-proxy');
const logger = require('heimdalljs-logger')('ember-cli:per-bundle-addon-cache');
const { TARGET_INSTANCE } = require('./target-instance');

function defaultAllowCachingPerBundle({ addonEntryPointModule }) {
  return (
    addonEntryPointModule.allowCachingPerBundle ||
    (addonEntryPointModule.prototype && addonEntryPointModule.prototype.allowCachingPerBundle)
  );
}

/**
 * Resolves the perBundleAddonCacheUtil; this prefers the custom provided version by
 * the consuming application, and defaults to an internal implementation here.
 *
 * @method resolvePerBundleAddonCacheUtil
 * @param {Project} project
 * @return {{allowCachingPerBundle: Function}}
 */
function resolvePerBundleAddonCacheUtil(project) {
  const relativePathToUtil =
    project.pkg && project.pkg['ember-addon'] && project.pkg['ember-addon'].perBundleAddonCacheUtil;

  if (typeof relativePathToUtil === 'string') {
    const absolutePathToUtil = path.resolve(project.root, relativePathToUtil);

    if (!fs.existsSync(absolutePathToUtil)) {
      throw new Error(
        `[ember-cli] the provided \`${relativePathToUtil}\` for \`ember-addon.perBundleAddonCacheUtil\` does not exist`
      );
    }

    return require(absolutePathToUtil);
  }

  return {
    allowCachingPerBundle: defaultAllowCachingPerBundle,
  };
}

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
 * in bundled by its LCA host - the single instance is the one bundled by this
 * host. All other instances (in any lazy engine) are proxies.
 *
 * NOTE: the optimization is only enabled if the environment variable that controls
 * `ember-engines` transitive deduplication (process.env.EMBER_ENGINES_ADDON_DEDUPE)
 * is set to a truthy value. For more info, see:
 * https://github.com/ember-engines/ember-engines/blob/master/packages/ember-engines/lib/engine-addon.js#L396
 *
 * @public
 * @class PerBundleAddonCache
 */
class PerBundleAddonCache {
  constructor(project) {
    this.project = project;

    // The cache of bundle-host package infos and their individual addon caches.
    // The cache is keyed by package info (representing a bundle host (project or
    // lazy engine)) and an addon instance cache to bundle with that bundle host.
    this.bundleHostCache = new Map();

    // Indicate if ember-engines transitive dedupe is enabled.
    this.engineAddonTransitiveDedupeEnabled = !!process.env.EMBER_ENGINES_ADDON_DEDUPE;
    this._perBundleAddonCacheUtil = resolvePerBundleAddonCacheUtil(this.project);

    // For stats purposes, counts on the # addons and proxies created. Addons we
    // can compare against the bundleHostCache addon caches. Proxies, not so much,
    // but we'll count them here.
    this.numAddonInstances = 0;
    this.numProxies = 0;
  }

  /**
   * The default implementation here is to indicate if the original addon entry point has
   * the `allowCachingPerBundle` flag set either on itself or on its prototype.
   *
   * If a consuming application specifies a relative path to a custom utility via the
   * `ember-addon.perBundleAddonCacheUtil` configuration, we prefer the custom implementation
   * provided by the consumer.
   *
   * @method allowCachingPerBundle
   * @param {Object|Function} addonEntryPointModule
   * @return {Boolean} true if the given constructor function or class supports caching per bundle, false otherwise
   */
  allowCachingPerBundle(addonEntryPointModule) {
    return this._perBundleAddonCacheUtil.allowCachingPerBundle({ addonEntryPointModule });
  }

  /**
   * Creates a cache entry for the bundleHostCache. Because we want to use the same sort of proxy
   * for both bundle hosts and for 'regular' addon instances (though their cache entries have
   * slightly different structures) we'll use the Symbol from getAddonProxy.
   *
   * @method createBundleHostCacheEntry
   * @param {PackageInfo} bundleHostPkgInfo bundle host's pkgInfo.realPath
   * @return {Object} an object in the form of a bundle-host cache entry
   */
  createBundleHostCacheEntry(bundleHostPkgInfo) {
    return { [TARGET_INSTANCE]: null, realPath: bundleHostPkgInfo.realPath, addonInstanceCache: new Map() };
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
      if (curr === this.project) {
        return curr;
      }

      if (isLazyEngine(curr)) {
        // if we're building a lazy engine in isolation, prefer that the bundle host is
        // the project, not the lazy engine addon instance
        if (curr.parent === this.project && curr._packageInfo === this.project._packageInfo) {
          return this.project;
        }

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
   *
   * If an addon instance is supposed to be bundled with a particular lazy engine, and
   * same addon is also to be bundled by a common LCA host, prefer the one bundled by the
   * host (since it's ultimately going to be deduped later by `ember-engines`).
   *
   * NOTE: this only applies if this.engineAddonTransitiveDedupeEnabled is truthy. If it is not,
   * the bundle host always "owns" the addon instance.
   *
   * If deduping is enabled and the LCA host also depends on the same addon,
   * the lazy-engine instances of the addon will all be proxies to the one in
   * the LCA host. This function indicates whether the bundle host passed in
   * (either the project or a lazy engine) is really the bundle host to "own" the
   * new addon.
   *
   * @method bundleHostOwnsInstance
   * @param (Object} bundleHost the project or lazy engine that is trying to "own"
   * the new addon instance specified by addonPkgInfo
   * @param {PackageInfo} addonPkgInfo the PackageInfo of the potential new addon instance
   * @return {Boolean} true if the bundle host is to "own" the instance, false otherwise.
   */
  bundleHostOwnsInstance(bundleHost, addonPkgInfo) {
    if (isLazyEngine(bundleHost)) {
      return (
        !this.engineAddonTransitiveDedupeEnabled ||
        !this.project.hostInfoCache
          .getHostAddonInfo(bundleHost._packageInfo)
          .hostAndAncestorBundledPackageInfos.has(addonPkgInfo)
      );
    }

    return true;
  }

  findBundleOwner(bundleHost, addonPkgInfo) {
    if (bundleHost === this.project._packageInfo) {
      return bundleHost;
    }

    let { hostPackageInfo, hostAndAncestorBundledPackageInfos } =
      this.project.hostInfoCache.getHostAddonInfo(bundleHost);

    if (!hostAndAncestorBundledPackageInfos.has(addonPkgInfo)) {
      return bundleHost;
    }

    return this.findBundleOwner(hostPackageInfo, addonPkgInfo);
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
   * except if it is an addon that's also owned by a given LCA host and transitive
   * dedupe is enabled (`engineAddonTransitiveDedupeEnabled`), in which case it will
   * only have a single copy in the project's addon cache.
   */
  getAddonInstance(parent, addonPkgInfo) {
    // If the new addon is itself a bundle host (i.e. lazy engine), there is only one
    // instance of the bundle host, and it's in the entries of the bundleHostCache, outside
    // of the 'regular' addon caches. Because 'setupBundleHostCache' ran during construction,
    // we know that an entry is in the cache with this engine name.
    if (addonPkgInfo.isForBundleHost()) {
      let cacheEntry = this._getBundleHostCacheEntry(addonPkgInfo);

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
    // If not, it means the bundle host is a lazy engine but the LCA host also uses
    // the addon and deduping is enabled
    //   * If the LCA host already has a cached entry, return a proxy to that
    //   * If it does not, create a 'blank' cache entry and return a proxy to that.
    //     When the addon is encountered later when processing the LCA host's addons,
    //     fill in the instance.
    if (this.bundleHostOwnsInstance(bundleHost, addonPkgInfo)) {
      let bundleHostCacheEntry = this._getBundleHostCacheEntry(bundleHost._packageInfo);
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
          // an addon that is used in a lazy engine but also used by its LCA host,
          // and we're now creating the instance for the LCA host.
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
      // The bundleHost is not the project but the some ancestor bundles the addon and
      // deduping is enabled, so the cache entry needs to go in the bundle owner's cache.
      // Get/create an empty cache entry and return a proxy to it. The bundle owner will
      // set the instance later (see above).
      let bundleHostCacheEntry = this._getBundleHostCacheEntry(
        this.findBundleOwner(bundleHost._packageInfo, addonPkgInfo)
      );
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

  getPathsToAddonsOptedIn() {
    const addonSet = new Set();

    for (const [, { addonInstanceCache }] of this.bundleHostCache) {
      Array.from(addonInstanceCache.keys()).forEach((realPath) => {
        addonSet.add(realPath);
      });
    }

    return Array.from(addonSet);
  }

  _getBundleHostCacheEntry(pkgInfo) {
    let cacheEntry = this.bundleHostCache.get(pkgInfo);

    if (!cacheEntry) {
      cacheEntry = this.createBundleHostCacheEntry(pkgInfo);
      this.bundleHostCache.set(pkgInfo, cacheEntry);
    }

    return cacheEntry;
  }

  // Support for per-bundle addon caching is GLOBAL opt OUT (unless you explicitly set
  // EMBER_CLI_ADDON_INSTANCE_CACHING to false, it will be enabled.) If you opt out, that
  // overrides setting `allowCachingPerBundle` for any particular addon type to true.
  // To help make testing easier, we'll expose the setting as a function so it can be
  // called multiple times and evaluate each time.
  static isEnabled() {
    return process.env.EMBER_CLI_ADDON_INSTANCE_CACHING !== 'false';
  }
}

module.exports = PerBundleAddonCache;
