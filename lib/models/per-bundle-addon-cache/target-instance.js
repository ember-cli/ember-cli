'use strict';

/**
 * A Symbol constant for sharing between index.js and addon-proxy.js rather than
 * putting the symbol into the Symbol global cache. The symbol is used in per-bundle
 * cache entries to refer to the field that points at the real instance that a Proxy
 * refers to.
 * @class TARGET_INSTANCE
 * @type Symbol
 * @private
 * @final
 */
const TARGET_INSTANCE = Symbol('_targetInstance_');

module.exports.TARGET_INSTANCE = TARGET_INSTANCE;
