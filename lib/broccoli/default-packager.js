'use strict';

const Funnel = require('broccoli-funnel');

const DEFAULT_BOWER_PATH = 'bower_components';

/**
 * Responsible for packaging Ember.js application.
 *
 * @class DefaultPackager
 * @constructor
 */
module.exports = class DefaultPackager {
  constructor() {
    this._cachedBower = null;
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
        srcDir: '/',
        destDir: bowerDirectory || DEFAULT_BOWER_PATH,
        annotation: 'Packaged Bower',
      });
    }

    return this._cachedBower;
  }
};
