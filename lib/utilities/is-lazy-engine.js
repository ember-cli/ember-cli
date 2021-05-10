'use strict';

/**
 * Indicate if a given object is a constructor function or class or an instance of an Addon.
 *
 * @module is-lazy-engine
 * @param {Object} addonCtorOrInstance the constructor function/class or an instance of an Addon.
 * @return {Boolean} True if the addonCtorOrInstance is a lazy engine, False otherwise.
 */
module.exports = function isLazyEngine(addonCtorOrInstance) {
  if (!addonCtorOrInstance) {
    return false;
  }

  if (addonCtorOrInstance.lazyLoading) {
    return addonCtorOrInstance.lazyLoading.enabled === true;
  } else if (addonCtorOrInstance.options) {
    return !!(addonCtorOrInstance.options.lazyLoading && addonCtorOrInstance.options.lazyLoading.enabled === true);
  } else if (addonCtorOrInstance.prototype) {
    if (addonCtorOrInstance.prototype.lazyLoading) {
      return addonCtorOrInstance.prototype.lazyLoading.enabled === true;
    } else if (addonCtorOrInstance.prototype.options) {
      return !!(
        addonCtorOrInstance.prototype.options.lazyLoading &&
        addonCtorOrInstance.prototype.options.lazyLoading.enabled === true
      );
    }
  }

  return false;
};
