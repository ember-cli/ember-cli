'use strict';

const FixturifyProject = require('./fixturify-project');
const { TARGET_INSTANCE } = require('../../lib/models/per-bundle-addon-cache/target-instance');
const isLazyEngine = require('../../lib/utilities/is-lazy-engine');

/**
 * This collects all addons by name within a given host; it stops traversing when it
 * encounters another host (i.e., a lazy engine). Within a given host we should expect
 * at most 1 real addon, otherwise this is an error condition. We otherwise add all
 * proxies to `config.proxies`
 *
 * @name getAllAddonsByNameWithinHost
 * @param {Project|Addon} projectOrAddon
 * @param {string} addonName
 * @param {Object} [config]
 * @returns {{proxies: Proxy[], realAddon: Addon}}
 */
function getAllAddonsByNameWithinHost(projectOrAddon, addonName, config = { proxies: [] }) {
  if (!config.originalHost) {
    config.originalHost = projectOrAddon;
  }

  projectOrAddon.addons.forEach((addon) => {
    if (addon.name === addonName) {
      if (config.realAddon && !addon[TARGET_INSTANCE]) {
        throw new Error(
          `The real addon (\`${addon.name}\`) has already been set for a given host (\`${
            typeof config.originalHost.name === 'function' ? config.originalHost.name() : config.originalHost.name
          }\`); the proxy for addon caching is not working correctly`
        );
      }

      if (addon[TARGET_INSTANCE]) {
        config.proxies.push(addon);
      } else {
        config.realAddon = addon;
      }
    }

    // stop traversing within another host
    if (!isLazyEngine(addon)) {
      getAllAddonsByNameWithinHost(addon, addonName, config);
    }
  });

  return config;
}

/**
 * Returns whether all instances within a given host are equal (i.e., that there's a single
 * "real addon") and all proxies have the `TARGET_INSTANCE` property that's strictly equal to
 * the aforementioned real addon
 *
 * @name areAllInstancesEqualWithinHost
 * @param {Project|Addon} projectOrAddon
 * @param {string} addonName
 * @returns {boolean}
 */
function areAllInstancesEqualWithinHost(projectOrAddon, addonName) {
  const { realAddon, proxies } = getAllAddonsByNameWithinHost(projectOrAddon, addonName);
  return proxies.length > 0 && proxies.every((proxy) => proxy[TARGET_INSTANCE] === realAddon);
}

/**
 * For a given project/addon, this counts addon instances within said project/addon;
 * specifically we're interested in the number of "real" addon instances, and proxy
 * objects.
 *
 * @name countAddons
 * @param {Project|Addon} projectOrAddon
 * @param {Object} [config]
 * @returns {{byName: Object, proxyCount: number, realAddonInstanceCount: number}}
 */
function countAddons(projectOrAddon, config = { byName: {}, proxyCount: 0, realAddonInstanceCount: 0 }) {
  projectOrAddon.addons.forEach((addon) => {
    const addonName = addon.name;

    if (!config.byName[addonName]) {
      config.byName[addonName] = {
        addons: [],
        proxyCount: 0,
        realAddonInstanceCount: 0,
      };
    }

    if (addon[TARGET_INSTANCE]) {
      config.proxyCount++;
      config.byName[addonName].proxyCount++;
    } else {
      config.realAddonInstanceCount++;
      config.byName[addonName].realAddonInstanceCount++;
    }

    config.byName[addonName].addons.push(addon);
    countAddons(addon, config);
  });

  return config;
}

/**
 * Generate the file structure used for the cache-bundle-hosts and enable-cache tests.
 * Puts it into the usual temporary location defined by ECFP.
 *
 * In this fixture, all the addon definitions are to be held in PROJECT/lib, even
 * though the project itself doesn't directly depend on a few of them. This is so
 * it's easier to create a single reference to a particular addon path, to enable
 * the proxy code to function.
 *
 * @name createStandardCacheFixture
 */
function createStandardCacheFixture() {
  let project = new FixturifyProject('test-ember-project', '1.0.0');

  // these two addons are defined in PROJECT/lib but the project doesn't depend
  // on them directly (their entries in the project's `ember-addon.paths` are
  // removed below); the addons and engines that follow share these two
  // definitions on disk by relative path
  project.addInRepoAddon('test-addon-dep', '1.0.0');
  project.addInRepoAddon('test-engine-dep', '1.0.0');
  project.pkg['ember-addon'].paths = [];

  project.addInRepoAddon('test-addon-a', '1.0.0', {
    callback: (addonA) => {
      addonA.pkg['ember-addon'].paths = ['../test-addon-dep'];
    },
  });

  project.addInRepoEngine('lazy-engine-a', '1.0.0', {
    enableLazyLoading: true,
    callback: (lazyEngineA) => {
      lazyEngineA.pkg['ember-addon'].paths = ['../test-engine-dep'];
    },
  });

  project.addInRepoEngine('lazy-engine-b', '1.0.0', {
    enableLazyLoading: true,
    callback: (lazyEngineB) => {
      lazyEngineB.pkg['ember-addon'].paths = ['../test-engine-dep', '../test-addon-dep'];
    },
  });

  project.addInRepoEngine('regular-engine-c', '1.0.0', {
    callback: (regularEngineC) => {
      regularEngineC.pkg['ember-addon'].paths = ['../test-engine-dep'];
    },
  });

  return project;
}

/**
 * For help with testing, given a bundleHostName and an addon name, return
 * a list of the addon cache entries that have that addon name.
 *
 * @name findAddonCacheEntriesByName
 */
function findAddonCacheEntriesByName(perBundleAddonCacheInstance, bundleHostPkgInfo, addonName) {
  let bundleHostCacheEntry = perBundleAddonCacheInstance.bundleHostCache.get(bundleHostPkgInfo);

  if (!bundleHostCacheEntry) {
    return null;
  }

  let addonInstanceCache = bundleHostCacheEntry.addonInstanceCache;
  let cacheEntries = Array.from(addonInstanceCache.values());
  let addonEntries = cacheEntries.filter((entry) => entry[TARGET_INSTANCE].name === addonName);

  return addonEntries;
}

/**
 * Simple utilities to help test the PerBundleAddonCache feature.
 */
module.exports = {
  findAddonCacheEntriesByName,
  createStandardCacheFixture,
  getAllAddonsByNameWithinHost,
  areAllInstancesEqualWithinHost,
  countAddons,
};
