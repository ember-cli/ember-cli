'use strict';

const Funnel = require('broccoli-funnel');

const DEFAULT_BOWER_PATH = 'bower_components';
const DEFAULT_VENDOR_PATH = 'vendor';

/**
 * Responsible for packaging Ember.js application.
 *
 * @class DefaultPackager
 * @constructor
 */
module.exports = class DefaultPackager {
  constructor() {
    this._cachedBower = null;
    this._cachedVendor = null;
  }

  /*
   * Given an input tree, returns a properly assembled Broccoli tree with bower
   * components.
   *
   * Given a tree:
   *
   * ```
   * ├── ember.js/
   * ├── pusher/
   * └── raven-js/
   * ```
   *
   * Returns:
   *
   * ```
   * [bowerDirectory]/
   * ├── ember.js/
   * ├── pusher/
   * └── raven-js/
   * ```
   *
   * @private
   * @method packageBower
   * @param {BroccoliTree} tree
   * @param {String} bowerDirectory Custom path to bower components
  */
  packageBower(tree, bowerDirectory) {
    if (this._cachedBower === null) {
      this._cachedBower = new Funnel(tree, {
        destDir: bowerDirectory || DEFAULT_BOWER_PATH,
        annotation: 'Packaged Bower',
      });
    }

    return this._cachedBower;
  }

  /*
   * Given an input tree, returns a properly assembled Broccoli tree with vendor
   * files.
   *
   * Given a tree:
   *
   * ```
   * ├── babel-polyfill/
   * ├── ember-cli-shims/
   * ├── ember-load-initializers/
   * ├── ember-qunit/
   * ├── ember-resolver/
   * ├── sinon/
   * └── tether/
   * ```
   *
   * Returns:
   *
   * ```
   * vendor/
   * ├── babel-polyfill/
   * ├── ember-cli-shims/
   * ├── ember-load-initializers/
   * ├── ember-qunit/
   * ├── ember-resolver/
   * ├── sinon/
   * └── tether/
   * ```
   *
   * @private
   * @method packageVendor
   * @param {BroccoliTree} tree
  */
  packageVendor(tree) {
    if (this._cachedVendor === null) {
      this._cachedVendor = new Funnel(tree, {
        destDir: DEFAULT_VENDOR_PATH,
        annotation: 'Packaged Vendor',
      });
    }

    return this._cachedVendor;
  }
};
