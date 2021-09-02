'use strict';

const { TARGET_INSTANCE } = require('./target-instance');

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
  let addonProxy = new Proxy(targetCacheEntry, {
    get(targetCacheEntry, property) {
      if (property === 'parent') {
        return parent;
      }

      if (property === 'app') {
        return _app;
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
            return targetCacheEntry[TARGET_INSTANCE][property](...arguments);
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

      if (targetCacheEntry[TARGET_INSTANCE]) {
        return Reflect.set(targetCacheEntry[TARGET_INSTANCE], property, value);
      }

      return Reflect.set(targetCacheEntry, property, value);
    },
  });

  return addonProxy;
}
module.exports = { getAddonProxy };
