'use strict';

const { TARGET_INSTANCE } = require('./target-instance');

const CACHE_KEY_FOR_TREE_TRACKER = Symbol('CACHE_KEY_FOR_TREE_TRACKER');

/**
 * Validates that a new cache key for a given tree type matches the previous
 * cache key for the same tree type. To opt-in to bundle addon caching for
 * a given addon it's assumed that it returns stable cache keys; specifically
 * this is because the interplay between bundle addon caching and `ember-engines`
 * when transitive deduplication is enabled assumes stable cache keys, so we validate
 * for this case here.
 *
 * @method validateCacheKey
 * @param {Addon} realAddonInstance The real addon instance
 * @param {string} treeType
 * @param {string} newCacheKey
 * @throws {Error} If the new cache key doesn't match the previous cache key
 */
function validateCacheKey(realAddonInstance, treeType, newCacheKey) {
  let cacheKeyTracker = realAddonInstance[CACHE_KEY_FOR_TREE_TRACKER];

  if (!cacheKeyTracker) {
    cacheKeyTracker = {};
    realAddonInstance[CACHE_KEY_FOR_TREE_TRACKER] = cacheKeyTracker;
  }

  cacheKeyTracker[treeType] = treeType in cacheKeyTracker ? cacheKeyTracker[treeType] : newCacheKey;

  if (cacheKeyTracker[treeType] !== newCacheKey) {
    throw new Error(
      `[ember-cli] addon bundle caching can only be used on addons that have stable cache keys (previously \`${
        cacheKeyTracker[treeType]
      }\`, now \`${newCacheKey}\`; for addon \`${realAddonInstance.name}\` located at \`${
        realAddonInstance.packageRoot || realAddonInstance.root
      }\`)`
    );
  }
}

/**
 * Returns a proxy to a target with specific handling for the
 * `parent` property, as well has to handle the `app` property;
 * that is, the proxy should maintain correct local state in
 * closure scope for the `app` property if it happens to be set
 * by `ember-cli`. Other than `parent` & `app`, this function also
 * proxies _almost_ everything to `target[TARGET_INSTANCE] with a few
 * exceptions: we trap & return `[]` for `addons`, and we don't return
 * the original `included` (it's already called on the "real" addon
 * by `ember-cli`).
 *
 * Note: the target is NOT the per-bundle cacheable instance of the addon. Rather,
 * it is a cache entry POJO from PerBundleAddonCache.
 *
 * @method getAddonProxy
 * @param targetCacheEntry the PerBundleAddonCache cache entry we are to proxy. It
 * has one interesting property, the real addon instance the proxy is forwarding
 * calls to (that property is not globally exposed).
 * @param parent the parent object of the proxy being created (the same as
 * the 'parent' property of a normal addon instance)
 * @return Proxy
 */
function getAddonProxy(targetCacheEntry, parent) {
  let _app;

  // handle `preprocessJs` separately for Embroider
  //
  // some context here:
  //
  // Embroider patches `preprocessJs`, so we want to maintain local state within the
  // proxy rather than allowing a patched `preprocessJs` set on the original addon
  // instance itself
  //
  // for more info as to where this happens, see:
  // https://github.com/embroider-build/embroider/blob/master/packages/compat/src/v1-addon.ts#L634
  let _preprocessJs;

  return new Proxy(targetCacheEntry, {
    get(targetCacheEntry, property) {
      if (property === 'parent') {
        return parent;
      }

      if (property === 'app') {
        return _app;
      }

      // only return `_preprocessJs` here if it was previously set to a patched version
      if (property === 'preprocessJs' && _preprocessJs) {
        return _preprocessJs;
      }

      // keep proxies from even trying to set or initialize addons
      if (property === 'initializeAddons') {
        return undefined;
      }

      // See the {@link index.js} file for a discussion of why the proxy 'addons'
      // property returns an empty array.
      if (property === 'addons') {
        return [];
      }

      // allow access to the property pointing to the real instance.
      if (property === TARGET_INSTANCE) {
        return targetCacheEntry[TARGET_INSTANCE];
      }

      // `included` will be called on the "real" addon, so there's no need for it to be
      // called again; instead we return a no-op implementation here
      if (property === 'included') {
        return () => undefined;
      }

      if (targetCacheEntry[TARGET_INSTANCE]) {
        if (property !== 'constructor' && typeof targetCacheEntry[TARGET_INSTANCE][property] === 'function') {
          // If we fall through to the Reflect.get just below, the 'this' context of the function when
          // invoked is the proxy, not the original instance (so its local state is incorrect).
          // Wrap the original methods to maintain the correct 'this' context.
          return function _originalAddonPropMethodWrapper() {
            let originalReturnValue = targetCacheEntry[TARGET_INSTANCE][property](...arguments);

            if (property === 'cacheKeyForTree') {
              const treeType = arguments[0];
              validateCacheKey(targetCacheEntry[TARGET_INSTANCE], treeType, originalReturnValue);
            }

            return originalReturnValue;
          };
        }

        return Reflect.get(targetCacheEntry[TARGET_INSTANCE], property);
      }

      return Reflect.get(targetCacheEntry, property);
    },
    set(targetCacheEntry, property, value) {
      if (property === 'app') {
        _app = value;
        return true;
      }

      if (property === 'preprocessJs') {
        _preprocessJs = value;
        return true;
      }

      if (targetCacheEntry[TARGET_INSTANCE]) {
        return Reflect.set(targetCacheEntry[TARGET_INSTANCE], property, value);
      }

      return Reflect.set(targetCacheEntry, property, value);
    },
  });
}

module.exports = { getAddonProxy };
