'use strict';

(function () {
  /*
   * Extend the systemjs loader to have the same /index fallback that our
   * classic AMD loader has.
   */
  (function (global) {
    var System = global.System;
    var systemJSPrototype = System.constructor.prototype;

    function* candidates(id) {
      yield id;
      if (id.endsWith('.js')) {
        yield id.slice(0, -3);
      }
      yield id + '/index';
    }

    var resolve = systemJSPrototype.resolve;
    systemJSPrototype.resolve = function (id, parentURL) {
      let firstError;
      for (let candidate of candidates(id)) {
        try {
          return resolve.call(this, candidate, parentURL);
        } catch (err) {
          if (!firstError) {
            firstError = err;
          }
        }
      }
      throw firstError;
    };

    global.PRIVATE_SYSTEM_HERE = new System.constructor();

  })(typeof self !== 'undefined' ? self : global);
})();
