'use strict';

(function () {
  /*
   * Extend the systemjs loader to have the same /index fallback that our
   * classic AMD loader has.
   */
  (function (global) {
    var System = global.System;
    var systemJSPrototype = System.constructor.prototype;
    var resolve = systemJSPrototype.resolve;
    systemJSPrototype.resolve = function (id, parentURL) {
      try {
        return resolve.call(this, id, parentURL);
      } catch (err) {
        return resolve.call(this, id + '/index', parentURL);
      }
    };
  })(typeof self !== 'undefined' ? self : global);
})();
