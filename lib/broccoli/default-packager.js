'use strict';

const p = require('ember-cli-preprocess-registry/preprocessors');
const path = require('path');
const Funnel = require('broccoli-funnel');
const mergeTrees = require('./merge-trees');
const ConfigLoader = require('broccoli-config-loader');
const addonProcessTree = require('../utilities/addon-process-tree');

const preprocessJs = p.preprocessJs;

const DEFAULT_BOWER_PATH = 'bower_components';
const DEFAULT_VENDOR_PATH = 'vendor';

/**
 * Responsible for packaging Ember.js application.
 *
 * @class DefaultPackager
 * @constructor
 */
module.exports = class DefaultPackager {
  constructor(options) {
    this._cachedTests = null;
    this._cachedBower = null;
    this._cachedVendor = null;
    this._cachedPublic = null;
    this._cachedConfig = null;

    this.options = options || {};

    this.env = this.options.env;
    this.name = this.options.name;
    this.project = this.options.project;
    this.registry = this.options.registry;
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

  /*
   * Given an input tree, returns a properly assembled Broccoli tree with tests
   * files.
   *
   * Given a tree:
   *
   * ```
   * ├── acceptance/
   * ├── helpers/
   * ├── index.html
   * ├── integration/
   * ├── test-helper.js
   * └── unit/
   * ```
   *
   * Returns:
   *
   * ```
   * [name]/
   * └── tests
   *     ├── acceptance/
   *     ├── helpers/
   *     ├── index.html
   *     ├── integration/
   *     ├── test-helper.js
   *     └── unit/
   * ```
   *
   * @private
   * @method packageTests
   * @param {BroccoliTree} tree
  */
  packageTests(tree) {
    if (this._cachedTests === null) {
      tree = addonProcessTree(this.project, 'preprocessTree', 'test', tree);

      tree = new Funnel(tree, {
        destDir: `${this.name}/tests`,
        annotation: 'Packaged Tests',
      });

      let preprocessedTests = preprocessJs(tree, '/tests', this.name, {
        registry: this.registry,
      });

      this._cachedTests = addonProcessTree(this.project, 'postprocessTree', 'test', preprocessedTests);
    }

    return this._cachedTests;
  }

  /*
   * Given input trees (both application and add-ons), merges them into one.
   *
   * Given a tree:
   *
   * ```
   * ├── 500.html
   * ├── images
   * ├── maintenance.html
   * └── robots.txt
   * ```
   *
   * And add-on tree:
   *
   * ```
   * ember-fetch/
   * └── fastboot-fetch.js
   * ```
   *
   * Returns:
   *
   * ```
   * ├── 500.html
   * ├── ember-fetch
   * │   └── fastboot-fetch.js
   * ├── images
   * ├── maintenance.html
   * └── robots.txt
   * ```
   *
   * @private
   * @method packagePublic
   * @param {Array<BroccoliTree>} trees
  */
  packagePublic(trees) {
    if (this._cachedPublic === null) {
      this._cachedPublic = mergeTrees(trees, {
        overwrite: true,
        annotation: 'Packaged Public',
      });
    }

    return this._cachedPublic;
  }

  /*
   * Given an input tree, returns a properly assembled Broccoli tree with
   * configuration files.
   *
   * Given a tree:
   *
   * ```
   * environments/
   * ├── development.json
   * └── test.json
   * ```
   *
   * Returns:
   *
   * ```
   * └── [name]
   *     └── config
   *         └── environments
   *             ├── development.json
   *             └── test.json
   * ```
   * @private
   * @method packageConfig
   * @param {Boolean} testsEnabled Boolean flag to control the inclusion of
   *                  `test.json` file in the resulting tree.
  */
  packageConfig(testsEnabled) {
    let env = this.env;
    let name = this.name;
    let project = this.project;
    let configPath = this.project.configPath();

    if (this._cachedConfig === null) {
      let configTree = new ConfigLoader(path.dirname(configPath), {
        env,
        tests: testsEnabled || false,
        project,
      });

      this._cachedConfig = new Funnel(configTree, {
        destDir: `${name}/config`,
        annotation: 'Packaged Config',
      });
    }

    return this._cachedConfig;
  }
};
