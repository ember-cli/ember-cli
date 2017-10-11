/* global require, module, escape */
'use strict';

/**
@module ember-cli
*/
const fs = require('fs');
const existsSync = require('exists-sync');
const path = require('path');
const p = require('ember-cli-preprocess-registry/preprocessors');
const chalk = require('chalk');
const resolve = require('resolve');

const Project = require('../models/project');
const cleanBaseURL = require('clean-base-url');
const SilentError = require('silent-error');

let preprocessJs = p.preprocessJs;
let preprocessCss = p.preprocessCss;
let isType = p.isType;

let preprocessTemplates = p.preprocessTemplates;

let preprocessMinifyCss = p.preprocessMinifyCss;

const concat = require('broccoli-concat');

const ConfigReplace = require('broccoli-config-replace');
const ConfigLoader = require('broccoli-config-loader');
const mergeTrees = require('./merge-trees');
const WatchedDir = require('broccoli-source').WatchedDir;
const UnwatchedDir = require('broccoli-source').UnwatchedDir;

const merge = require('ember-cli-lodash-subset').merge;
const defaultsDeep = require('ember-cli-lodash-subset').defaultsDeep;
const omitBy = require('ember-cli-lodash-subset').omitBy;
const isNull = require('ember-cli-lodash-subset').isNull;
const Funnel = require('broccoli-funnel');
const funnelReducer = require('broccoli-funnel-reducer');
const logger = require('heimdalljs-logger')('ember-cli:ember-app');
const addonProcessTree = require('../utilities/addon-process-tree');
const lintAddonsByType = require('../utilities/lint-addons-by-type');
const experiments = require('../experiments');
const processModulesOnly = require('./babel-process-modules-only');
const semver = require('semver');
const Bundler = require('./bundler');

let DEFAULT_CONFIG = {
  storeConfigInMeta: true,
  autoRun: true,
  outputPaths: {
    app: {
      html: 'index.html',
    },
    tests: {
      js: '/assets/tests.js',
    },
    vendor: {
      css: '/assets/vendor.css',
      js: '/assets/vendor.js',
    },
    testSupport: {
      css: '/assets/test-support.css',
      js: {
        testSupport: '/assets/test-support.js',
        testLoader: '/assets/test-loader.js',
      },
    },
  },
  minifyCSS: {
    options: { relativeTo: 'assets' },
  },
  sourcemaps: {},
  trees: {},
  jshintrc: {},
  addons: {},
};

class EmberApp {
  /**
   EmberApp is the main class Ember CLI uses to manage the Broccoli trees
   for your application. It is very tightly integrated with Broccoli and has
   a `toTree()` method you can use to get the entire tree for your application.

   Available init options:
   - storeConfigInMeta, defaults to `true`
   - autoRun, defaults to `true`
   - outputPaths, defaults to `{}`
   - minifyCSS, defaults to `{enabled: !!isProduction,options: { relativeTo: 'assets' }}
   - minifyJS, defaults to `{enabled: !!isProduction}
   - sourcemaps, defaults to `{}`
   - trees, defaults to `{}`
   - jshintrc, defaults to `{}`
   - vendorFiles, defaults to `{}`
   - addons, defaults to `{ blacklist: [], whitelist: [] }`

   @class EmberApp
   @constructor
   @param {Object} [defaults]
   @param {Object} [options={}] Configuration options
   */
  constructor(defaults, options) {
    if (arguments.length === 0) {
      options = {};
    } else if (arguments.length === 1) {
      options = defaults;
    } else {
      defaultsDeep(options, defaults);
    }

    this._initProject(options);
    this.name = options.name || this.project.name();

    this.env = EmberApp.env();
    this.isProduction = (this.env === 'production');

    this.registry = options.registry || p.defaultRegistry(this);

    this.bowerDirectory = this.project.bowerDirectory;

    this._initTestsAndHinting(options);
    this._initOptions(options);
    this._initVendorFiles();

    this._styleOutputFiles = { };

    // ensure addon.css always gets concated
    this._styleOutputFiles[this.options.outputPaths.vendor.css] = [];


    this._scriptOutputFiles = {};
    this._customTransformsMap = new Map();

    this.legacyFilesToAppend = [];
    this.vendorStaticStyles = [];
    this.otherAssetPaths = [];
    this.legacyTestFilesToAppend = [];
    this.vendorTestStaticStyles = [];
    this._nodeModules = new Map();

    this.trees = this.options.trees;

    this.populateLegacyFiles();
    this.initializeAddons();
    this.project.addons.forEach(addon => addon.app = this);
    p.setupRegistry(this);
    this._importAddonTransforms();
    this._notifyAddonIncluded();

    if (!this._addonInstalled('loader.js') && !this.options._ignoreMissingLoader) {
      throw new SilentError('The loader.js addon is missing from your project, please add it to `package.json`.');
    }

    this.bundler = new Bundler({
      name: this.name,
      sourcemaps: this.options.sourcemaps,
      appOutputPath: this.options.outputPaths.app.js,
      vendorFilePath: this.options.outputPaths.vendor.js,
      isBabelAvailable: this._addonInstalled('ember-cli-babel'),
    });
  }

  /**
    Initializes the `tests` and `hinting` properties.

    Defaults to `false` unless `ember test` was used or this is *not* a production build.

    @private
    @method _initTestsAndHinting
    @param {Object} options
  */
  _initTestsAndHinting(options) {
    let testsEnabledDefault = process.env.EMBER_CLI_TEST_COMMAND || !this.isProduction;

    this.tests = options.hasOwnProperty('tests') ? options.tests : testsEnabledDefault;
    this.hinting = options.hasOwnProperty('hinting') ? options.hinting : testsEnabledDefault;
  }

  /**
    Initializes the `project` property from `options.project` or the
    closest Ember CLI project from the current working directory.

    @private
    @method _initProject
    @param {Object} options
  */
  _initProject(options) {
    let app = this;

    this.project = options.project || Project.closestSync(process.cwd());

    if (options.configPath) {
      this.project.configPath = function() { return app._resolveLocal(options.configPath); };
    }
  }

  /**
    Initializes the `options` property from the `options` parameter and
    a set of default values from Ember CLI.

    @private
    @method _initOptions
    @param {Object} options
  */
  _initOptions(options) {
    let srcPath = this._resolveLocal('src');
    let srcTree = existsSync(srcPath) ? new WatchedDir(srcPath) : null;

    let appPath = this._resolveLocal('app');
    let appTree;
    if (experiments.MODULE_UNIFICATION) {
      appTree = existsSync(appPath) ? new WatchedDir(appPath) : null;
    } else {
      appTree = new WatchedDir(appPath);
    }

    let testsPath = this._resolveLocal('tests');
    let testsTree = existsSync(testsPath) ? new WatchedDir(testsPath) : null;

    // these are contained within app/ no need to watch again
    // (we should probably have the builder or the watcher dedup though)

    if (experiments.MODULE_UNIFICATION) {
      let srcStylesPath = this._resolveLocal('src/ui/styles');
      this._stylesPath = existsSync(srcStylesPath) ? srcStylesPath : this._resolveLocal('app/styles');
    } else {
      this._stylesPath = this._resolveLocal('app/styles');
    }
    let stylesTree = new UnwatchedDir(this._stylesPath);

    let templatesPath = this._resolveLocal('app/templates');
    let templatesTree = existsSync(templatesPath) ? new UnwatchedDir(templatesPath) : null;

    // do not watch bower's default directory by default
    let bowerDirectory = this._resolveLocal(this.bowerDirectory);
    let bowerTree = this.project._watchmanInfo.enabled ? bowerDirectory : new UnwatchedDir(bowerDirectory);

    let vendorPath = this._resolveLocal('vendor');
    let vendorTree = existsSync(vendorPath) ? new WatchedDir(vendorPath) : null;

    let publicPath = this._resolveLocal('public');
    let publicTree = existsSync(publicPath) ? new WatchedDir(publicPath) : null;

    let detectedDefaultOptions = {
      babel: { },
      jshintrc: {
        app: this.project.root,
        tests: testsPath,
      },
      minifyCSS: {
        enabled: this.isProduction,
        options: { processImport: false },
      },
      minifyJS: {
        enabled: this.isProduction,
        options: {
          compress: {
            // this is adversely affects heuristics for IIFE eval
            'negate_iife': false,
            // limit sequences because of memory issues during parsing
            sequences: 30,
          },
          output: {
            // no difference in size and much easier to debug
            semicolons: false,
          },
        },
      },
      outputPaths: {
        app: {
          css: {
            'app': `/assets/${this.name}.css`,
          },
          js: `/assets/${this.name}.js`,
        },
      },
      sourcemaps: {
        enabled: !this.isProduction,
        extensions: ['js'],
      },
      trees: {
        src: srcTree,
        app: appTree,
        tests: testsTree,
        styles: stylesTree,
        templates: templatesTree,
        bower: bowerTree,
        vendor: vendorTree,
        public: publicTree,
      },
    };

    let emberCLIBabelInstance = this.project.findAddonByName('ember-cli-babel');
    if (emberCLIBabelInstance) {
      let version = this.project.require('ember-cli-babel/package').version;
      if (semver.lt(version, '6.0.0-alpha.1')) {
        detectedDefaultOptions.babel = {
          modules: 'amdStrict',
          moduleIds: true,
          resolveModuleSource: require('amd-name-resolver').moduleResolve,
        };
      }

      // future versions of ember-cli-babel will be moving the location for its
      // own configuration options out of `babel` and will be issuing a deprecation
      // if used in the older way
      //
      // see: https://github.com/babel/ember-cli-babel/pull/105
      let emberCLIBabelConfigKey = emberCLIBabelInstance.configKey || 'babel';
      detectedDefaultOptions[emberCLIBabelConfigKey] = detectedDefaultOptions[emberCLIBabelConfigKey] || {};
      detectedDefaultOptions[emberCLIBabelConfigKey].compileModules = true;
    }

    this.options = defaultsDeep(options, detectedDefaultOptions, DEFAULT_CONFIG);

    // For now we must disable Babel sourcemaps due to unforeseen
    // performance regressions.
    if (!('sourceMaps' in this.options.babel)) {
      this.options.babel.sourceMaps = false;
    }
  }

  /**
    Resolves a path relative to the project's root

    @private
    @method _resolveLocal
  */
  _resolveLocal(to) {
    return path.join(this.project.root, to);
  }

  /**
    @private
    @method _initVendorFiles
  */
  _initVendorFiles() {
    let bowerDeps = this.project.bowerDependencies();
    let ember = this.project.findAddonByName('ember-source');
    let addonEmberCliShims = this.project.findAddonByName('ember-cli-shims');
    let bowerEmberCliShims = bowerDeps['ember-cli-shims'];
    let developmentEmber;
    let productionEmber;
    let emberTesting;
    let emberShims = null;
    let jquery;

    if (ember) {
      developmentEmber = ember.paths.debug;
      productionEmber = ember.paths.prod;
      emberTesting = ember.paths.testing;
      emberShims = ember.paths.shims;
      jquery = ember.paths.jquery;
    } else {
      jquery = `${this.bowerDirectory}/jquery/dist/jquery.js`;

      if (bowerEmberCliShims) {
        emberShims = `${this.bowerDirectory}/ember-cli-shims/app-shims.js`;
      }

      // in Ember 1.10 and higher `ember.js` is deprecated in favor of
      // the more aptly named `ember.debug.js`.
      productionEmber = `${this.bowerDirectory}/ember/ember.prod.js`;
      developmentEmber = `${this.bowerDirectory}/ember/ember.debug.js`;
      if (!existsSync(this._resolveLocal(developmentEmber))) {
        developmentEmber = `${this.bowerDirectory}/ember/ember.js`;
      }
      emberTesting = `${this.bowerDirectory}/ember/ember-testing.js`;
    }

    let handlebarsVendorFiles;
    if ('handlebars' in bowerDeps) {
      handlebarsVendorFiles = {
        development: `${this.bowerDirectory}/handlebars/handlebars.js`,
        production: `${this.bowerDirectory}/handlebars/handlebars.runtime.js`,
      };
    } else {
      handlebarsVendorFiles = null;
    }

    this.vendorFiles = omitBy(merge({
      'jquery.js': jquery,
      'handlebars.js': handlebarsVendorFiles,
      'ember.js': {
        development: developmentEmber,
        production: productionEmber,
      },
      'ember-testing.js': [
        emberTesting,
        { type: 'test' },
      ],
      'app-shims.js': emberShims,
      'ember-resolver.js': [
        `${this.bowerDirectory}/ember-resolver/dist/modules/ember-resolver.js`, {
          exports: {
            'ember/resolver': ['default'],
          },
        },
      ],
    }, this.options.vendorFiles), isNull);

    if (this._addonInstalled('ember-resolver') || !bowerDeps['ember-resolver']) {
      // if the project is using `ember-resolver` as an addon
      // remove it from `vendorFiles` (the NPM version properly works
      // without `app.import`s)
      delete this.vendorFiles['ember-resolver.js'];
    }

    // Warn if ember-cli-shims is not included.
    // certain versions of `ember-source` bundle them by default,
    // so we must check if that is the load mechanism of ember
    // before checking `bower`.
    if (!emberShims && !addonEmberCliShims && !bowerEmberCliShims) {
      this.project.ui.writeWarnLine('You have not included `ember-cli-shims` in your project\'s `bower.json` or `package.json`. This only works if you provide an alternative yourself and unset `app.vendorFiles[\'app-shims.js\']`.');
    }

    // If ember-testing.js is coming from Bower (not ember-source) and it does not
    // exist, then we remove it from vendor files. This is needed to support versions
    // of Ember older than 1.8.0 (when ember-testing.js was incldued in ember.js itself)
    if (!ember && this.vendorFiles['ember-testing.js'] && !existsSync(this.vendorFiles['ember-testing.js'][0])) {
      delete this.vendorFiles['ember-testing.js'];
    }
  }

  /**
    Returns the environment name

    @public
    @static
    @method env
    @return {String} Environment name
   */
  static env() {
    return process.env.EMBER_ENV || 'development';
  }

  /**
    Provides a broccoli files concatenation filter that's configured
    properly for this application.

    @deprecated
    @method concatFiles
    @param tree
    @param options
    @return
  */
  concatFiles(tree, options) {
    this.project.ui.writeDeprecateLine('EmberApp.concatFiles() is deprecated. Please use the `broccoli-concat` module directly.');
    return this._concatFiles(tree, options);
  }

  /**
    Delegates to `broccoli-concat` with the `sourceMapConfig` option set to `options.sourcemaps`.

    @private
    @method _concatFiles
    @param tree
    @param options
    @return
  */
  _concatFiles(tree, options) {
    options.sourceMapConfig = this.options.sourcemaps;

    return concat(tree, options);
  }

  /**
    Checks the result of `addon.isEnabled()` if it exists, defaults to `true` otherwise.

    @private
    @method _addonEnabled
    @param {Addon} addon
    @return {Boolean}
  */
  _addonEnabled(addon) {
    return !addon.isEnabled || addon.isEnabled();
  }

  /**
    @private
    @method _addonDisabledByBlacklist
    @param {Addon} addon
    @return {Boolean}
  */
  _addonDisabledByBlacklist(addon) {
    let blacklist = this.options.addons.blacklist;
    return !!blacklist && blacklist.indexOf(addon.name) !== -1;
  }

  /**
    @private
    @method _addonDisabledByWhitelist
    @param {Addon} addon
    @return {Boolean}
  */
  _addonDisabledByWhitelist(addon) {
    let whitelist = this.options.addons.whitelist;
    return !!whitelist && whitelist.indexOf(addon.name) === -1;
  }

  /**
    Returns whether an addon should be added to the project

    @private
    @method shouldIncludeAddon
    @param {Addon} addon
    @return {Boolean}
  */
  shouldIncludeAddon(addon) {
    if (!this._addonEnabled(addon)) {
      return false;
    }

    return !this._addonDisabledByBlacklist(addon) && !this._addonDisabledByWhitelist(addon);
  }

  /**
    Calls the included hook on addons.

    @private
    @method _notifyAddonIncluded
  */
  _notifyAddonIncluded() {
    let addonNames = this.project.addons.map(addon => addon.name);

    if (this.options.addons.blacklist) {
      this.options.addons.blacklist.forEach(addonName => {
        if (addonNames.indexOf(addonName) === -1) {
          throw new Error(`Addon "${addonName}" defined in blacklist is not found`);
        }
      });
    }

    if (this.options.addons.whitelist) {
      this.options.addons.whitelist.forEach(addonName => {
        if (addonNames.indexOf(addonName) === -1) {
          throw new Error(`Addon "${addonName}" defined in whitelist is not found`);
        }
      });
    }

    this.project.addons = this.project.addons.filter(addon => {
      if (this.shouldIncludeAddon(addon)) {
        if (addon.included) {
          addon.included(this);
        }

        return addon;
      }
    });
  }

  /**
    Calls the importTransforms hook on addons.

    @private
    @method _importAddonTransforms
  */
  _importAddonTransforms() {
    this.project.addons.forEach(addon => {
      if (this.shouldIncludeAddon(addon)) {
        if (addon.importTransforms) {
          let transforms = addon.importTransforms();

          if (!transforms) {
            throw new Error(`Addon "${addon.name}" did not return a transform map from importTransforms function`);
          }

          Object.keys(transforms).forEach(transformName => {
            let transformConfig = {
              files: [],
              options: {},
            };

            // store the transform info
            if (typeof transforms[transformName] === 'object') {
              transformConfig['callback'] = transforms[transformName].transform;
              transformConfig['processOptions'] = transforms[transformName].processOptions;
            } else if (typeof transforms[transformName] === 'function') {
              transformConfig['callback'] = transforms[transformName];
              transformConfig['processOptions'] = (assetPath, entry, options) => options;
            } else {
              throw new Error(`Addon "${addon.name}" did not return a callback function correctly for transform "${transformName}".`);
            }

            if (this._customTransformsMap.has(transformName)) {
              // there is already a transform with a same name, therefore we warn the user
              this.project.ui.writeWarnLine(`Addon "${addon.name}" is defining a transform name: ${transformName} that is already being defined. Using transform from addon: "${addon.name}".`);
            }

            this._customTransformsMap.set(transformName, transformConfig);
          });
        }
      }
    });
  }

  /**
    Loads and initializes addons for this project.
    Calls initializeAddons on the Project.

    @private
    @method initializeAddons
  */
  initializeAddons() {
    this.project.initializeAddons();
  }

  /**
    Returns a list of trees for a given type, returned by all addons.

    @private
    @method addonTreesFor
    @param  {String} type Type of tree
    @return {Array}       List of trees
   */
  addonTreesFor(type) {
    return this.project.addons.reduce((sum, addon) => {
      if (addon.treeFor) {
        let val = addon.treeFor(type);
        if (val) { sum.push(val); }
      }
      return sum;
    }, []);
  }

  /**
    Runs addon post-processing on a given tree and returns the processed tree.

    This enables addons to do process immediately **after** the preprocessor for a
    given type is run, but before concatenation occurs. If an addon wishes to
    apply a transform before the preprocessors run, they can instead implement the
    preprocessTree hook.

    To utilize this addons implement `postprocessTree` hook.

    An example, would be to apply some broccoli transform on all JS files, but
    only after the existing pre-processors have run.

    ```js
    module.exports = {
      name: 'my-cool-addon',
      postprocessTree(type, tree) {
        if (type === 'js') {
          return someBroccoliTransform(tree);
        }

        return tree;
      }
    }

    ```

    @private
    @method addonPostprocessTree
    @param  {String} type Type of tree
    @param  {Tree}   tree Tree to process
    @return {Tree}        Processed tree
   */
  addonPostprocessTree(type, tree) {
    return addonProcessTree(this.project, 'postprocessTree', type, tree);
  }


  /**
    Runs addon pre-processing on a given tree and returns the processed tree.

    This enables addons to do process immediately **before** the preprocessor for a
    given type is run.  If an addon wishes to apply a transform  after the
    preprocessors run, they can instead implement the postprocessTree hook.

    To utilize this addons implement `preprocessTree` hook.

    An example, would be to remove some set of files before the preprocessors run.

    ```js
    var stew = require('broccoli-stew');

    module.exports = {
      name: 'my-cool-addon',
      preprocessTree(type, tree) {
        if (type === 'js' && type === 'template') {
          return stew.rm(tree, someGlobPattern);
        }

        return tree;
      }
    }
    ```

    @private
    @method addonPreprocessTree
    @param  {String} type Type of tree
    @param  {Tree}   tree Tree to process
    @return {Tree}        Processed tree
   */
  addonPreprocessTree(type, tree) {
    return addonProcessTree(this.project, 'preprocessTree', type, tree);
  }

  /**
    Runs addon lintTree hooks and returns a single tree containing all
    their output.

    @private
    @method addonLintTree
    @param  {String} type Type of tree
    @param  {Tree}   tree Tree to process
    @return {Tree}        Processed tree
   */
  addonLintTree(type, tree) {
    let output = lintAddonsByType(this.project.addons, type, tree);

    return mergeTrees(output, {
      overwrite: true,
      annotation: `TreeMerger (lint ${type})`,
    });
  }

  /**
    Imports legacy imports in this.vendorFiles

    @private
    @method populateLegacyFiles
  */
  populateLegacyFiles() {
    let name;
    for (name in this.vendorFiles) {
      let args = this.vendorFiles[name];

      if (args === null) { continue; }

      this.import.apply(this, [].concat(args));
    }
  }

  /**
    Returns the tree for app/index.html

    @private
    @method index
    @return {Tree} Tree for app/index.html
  */
  index() {
    let htmlName = this.options.outputPaths.app.html;

    let index;
    if (!experiments.MODULE_UNIFICATION || !this.trees.src) {
      index = this._rawAppIndex(htmlName);
    } else {
      let appIndex = this._rawAppIndex(htmlName, true);
      let srcIndex = this._rawSrcIndex(htmlName);
      index = mergeTrees([appIndex, srcIndex], { overwrite: true });
    }

    return new ConfigReplace(index, this._configTree(), {
      configPath: path.join(this.name, 'config', 'environments', `${this.env}.json`),
      files: [htmlName],
      patterns: this._configReplacePatterns(),
    });
  }

  _rawAppIndex(outputPath, optional) {
    if (!this.trees.app) { return; }

    return new Funnel(this.trees.app, {
      [optional ? 'include' : 'files']: ['index.html'],
      getDestinationPath: () => outputPath,
      annotation: 'Funnel: index.html',
    });
  }

  _rawSrcIndex(outputPath) {
    return new Funnel(this.trees.src, {
      files: ['ui/index.html'],
      getDestinationPath: () => outputPath,
      annotation: 'Funnel: index.html',
    });
  }

  /**
    Filters styles and templates from the `app` tree.

    @private
    @method _filterAppTree
    @return {Tree}
  */
  _filterAppTree() {
    if (!this.trees.app) {
      return;
    }

    if (!this._cachedFilterAppTree) {
      let podPatterns = this._podTemplatePatterns();
      let excludePatterns = podPatterns.concat([
        // note: do not use path.sep here Funnel uses
        // walk-sync which always joins with `/` (not path.sep)
        'styles/**/*',
        'templates/**/*',
      ]);

      this._cachedFilterAppTree = new Funnel(this.trees.app, {
        exclude: excludePatterns,
        annotation: 'Funnel: Filtered App',
      });
    }

    return this._cachedFilterAppTree;
  }

  podTemplates() {
    return new Funnel(this.trees.app, {
      include: this._podTemplatePatterns(),
      exclude: ['templates/**/*'],
      destDir: `${this.name}/`,
      annotation: 'Funnel: Pod Templates',
    });
  }

  _templatesTree() {
    if (!this._cachedTemplateTree) {
      let trees = [];
      if (this.trees.templates) {
        let standardTemplates = new Funnel(this.trees.templates, {
          srcDir: '/',
          destDir: `${this.name}/templates`,
          annotation: 'Funnel: Templates',
        });

        trees.push(standardTemplates);
      }

      if (this.trees.app) {
        trees.push(this.podTemplates());
      }

      this._cachedTemplateTree = mergeTrees(trees, {
        annotation: 'TreeMerge (templates)',
      });
    }

    return this._cachedTemplateTree;
  }

  /**
    @private
    @method _configReplacePatterns
    @return
  */
  _configReplacePatterns() {
    return [{
      match: /{{rootURL}}/g,
      replacement: calculateRootURL,
    }, {
      match: /{{EMBER_ENV}}/g,
      replacement: calculateEmberENV,
    }, {
      match: /{{content-for ['"](.+)["']}}/g,
      replacement: this.contentFor.bind(this),
    }, {
      match: /{{MODULE_PREFIX}}/g,
      replacement: calculateModulePrefix,
    }];
  }

  /**
    Returns the tree for /tests/index.html

    @private
    @method testIndex
    @return {Tree} Tree for /tests/index.html
   */
  testIndex() {
    let index = new Funnel(this.trees.tests, {
      srcDir: '/',
      files: ['index.html'],
      destDir: '/tests',
      annotation: 'Funnel (test index)',
    });

    return new ConfigReplace(index, this._configTree(), {
      configPath: path.join(this.name, 'config', 'environments', 'test.json'),
      files: ['tests/index.html'],
      env: 'test',
      patterns: this._configReplacePatterns(),
    });
  }

  /**
    Returns the tree for /public

    @private
    @method publicTree
    @return {Tree} Tree for /public
   */
  publicTree() {
    let trees = this.addonTreesFor('public');

    if (this.trees.public) {
      trees.push(this.trees.public);
    }

    return mergeTrees(trees, {
      overwrite: true,
      annotation: 'TreeMerge (public)',
    });
  }


  /**
    @private
    @method _processedAppTree
    @return
  */
  _processedAppTree() {
    let appTrees = [].concat(
      this.addonTreesFor('app'),
      this._filterAppTree()
    ).filter(Boolean);

    let mergedApp = mergeTrees(appTrees, {
      overwrite: true,
      annotation: 'TreeMerger (app)',
    });

    return new Funnel(mergedApp, {
      srcDir: '/',
      destDir: this.name,
      annotation: 'ProcessedAppTree',
    });
  }

  /**
    @private
    @method _processedSrcTree
    @return
  */
  _processedSrcTree() {
    if (!experiments.MODULE_UNIFICATION) {
      return null;
    }
    // styles
    // templates
    let rawSrcTree = this.trees.src;

    if (!rawSrcTree) { return; }

    let srcNamespacedTree = new Funnel(rawSrcTree, {
      destDir: 'src',
    });

    let srcAfterPreprocessTreeHook = this.addonPreprocessTree('src', srcNamespacedTree);

    let options = {
      outputPaths: this.options.outputPaths.app.css,
      registry: this.registry,
    };

    // TODO: This isn't quite correct (but it does function properly in most cases),
    // and should be re-evaluated before enabling the `MODULE_UNIFICATION` feature
    this._srcAfterStylePreprocessing = preprocessCss(srcAfterPreprocessTreeHook, '/src/ui/styles', '/assets', options);

    let srcAfterTemplatePreprocessing = preprocessTemplates(srcAfterPreprocessTreeHook, {
      registry: this.registry,
      annotation: 'Process Templates: src',
    });

    let srcAfterPostprocessTreeHook = this.addonPostprocessTree('src', srcAfterTemplatePreprocessing);

    return new Funnel(srcAfterPostprocessTreeHook, {
      srcDir: '/',
      destDir: `${this.name}`,
      annotation: 'Funnel: src',
    });
  }

  /**
    @private
    @method _processedTemplatesTree
    @return
  */
  _processedTemplatesTree() {
    let addonTrees = this.addonTreesFor('templates');
    let mergedTemplates = mergeTrees(addonTrees, {
      overwrite: true,
      annotation: 'TreeMerger (templates)',
    });

    let addonTemplates = new Funnel(mergedTemplates, {
      srcDir: '/',
      destDir: `${this.name}/templates`,
      annotation: 'ProcessedTemplateTree',
    });

    let combinedTemplates = mergeTrees([
      addonTemplates,
      this._templatesTree(),
    ], {
      annotation: 'addonPreprocessTree(template)',
      overwrite: true,
    });

    let templates = this.addonPreprocessTree('template', combinedTemplates);

    return this.addonPostprocessTree('template', preprocessTemplates(templates, {
      registry: this.registry,
      annotation: 'TreeMerger (pod & standard templates)',
    }));
  }

  /**
    @private
    @method _podTemplatePatterns
    @return {Array} An array of regular expressions.
  */
  _podTemplatePatterns() {
    return this.registry.extensionsForType('template')
      .map(extension => `**/*/template.${extension}`);
  }

  /**
    @private
    @method _processedTestsTree
    @return
  */
  _processedTestsTree() {
    let addonTrees = this.addonTreesFor('test-support');
    let mergedTests = mergeTrees(addonTrees.concat(this.trees.tests), {
      overwrite: true,
      annotation: 'TreeMerger (tests)',
    });

    return new Funnel(mergedTests, {
      srcDir: '/',
      destDir: `${this.name}/tests`,
      annotation: 'ProcessedTestTree',
    });
  }

  /**
    @private
    @method _processedBowerTree
    @return
  */
  _processedBowerTree() {
    if (!this._cachedBowerTree) {
      // do not attempt to merge bower and vendor together
      // if they are the same tree
      if (this.bowerDirectory === 'vendor') {
        return;
      }

      // Don't blow up if there is no bower_components folder.
      if (!existsSync(this.bowerDirectory)) {
        return;
      }

      this._cachedBowerTree = new Funnel(this.trees.bower, {
        srcDir: '/',
        destDir: `${this.bowerDirectory}/`,
        annotation: 'Funnel (bower)',
      });
    }

    return this._cachedBowerTree;
  }

  _nodeModuleTrees() {
    if (!this._cachedNodeModuleTrees) {
      this._cachedNodeModuleTrees = Array.from(this._nodeModules.values(), module => new Funnel(module.path, {
        srcDir: '/',
        destDir: `node_modules/${module.name}/`,
        annotation: `Funnel (node_modules/${module.name})`,
      }));
    }

    return this._cachedNodeModuleTrees;
  }

  _addonTree() {
    if (!this._cachedAddonTree) {
      let addonTrees = this.addonTreesFor('addon');

      let combinedAddonTree = mergeTrees(addonTrees, {
        overwrite: true,
        annotation: 'TreeMerger: `addon/` trees',
      });

      this._cachedAddonTree = new Funnel(combinedAddonTree, {
        destDir: 'addon-tree-output',
        annotation: 'Funnel: addon-tree-output',
      });
    }

    return this._cachedAddonTree;
  }

  /**
    @private
    @method _processedVendorTree
    @return
  */
  _processedVendorTree() {
    if (!this._cachedVendorTree) {
      let trees = this.addonTreesFor('vendor');

      if (this.trees.vendor) {
        trees.push(this.trees.vendor);
      }

      let mergedVendor = mergeTrees(trees, {
        overwrite: true,
        annotation: 'TreeMerger (vendor)',
      });

      this._cachedVendorTree = new Funnel(mergedVendor, {
        srcDir: '/',
        destDir: 'vendor/',
        annotation: 'Funnel (vendor)',
      });
    }

    return this._cachedVendorTree;
  }

  /**
    @private
    @method _processedExternalTree
    @return
  */
  _processedExternalTree() {
    if (!this._cachedExternalTree) {
      let vendor = this._processedVendorTree();
      let bower = this._processedBowerTree();
      let addons = this._addonTree();

      let trees = [vendor].concat(addons);
      if (bower) {
        trees.unshift(bower);
      }

      trees = this._nodeModuleTrees().concat(trees);

      let externalTree = mergeTrees(trees, {
        annotation: 'TreeMerger (ExternalTree)',
        overwrite: true,
      });

      for (let customTransformEntry of this._customTransformsMap) {
        let transformName = customTransformEntry[0];
        let transformConfig = customTransformEntry[1];

        let transformTree = new Funnel(externalTree, {
          files: transformConfig.files,
          annotation: `Funnel (custom transform: ${transformName})`,
        });

        externalTree = mergeTrees([externalTree, transformConfig.callback(transformTree, transformConfig.options)], {
          annotation: `TreeMerger (custom transform: ${transformName})`,
          overwrite: true,
        });
      }

      this._cachedExternalTree = externalTree;
    }

    return this._cachedExternalTree;
  }

  /**
    @private
    @method _configTree
    @return
  */
  _configTree() {
    if (!this._cachedConfigTree) {
      let configPath = this.project.configPath();
      let configTree = new ConfigLoader(path.dirname(configPath), {
        env: this.env,
        tests: this.tests,
        project: this.project,
      });

      this._cachedConfigTree = new Funnel(configTree, {
        srcDir: '/',
        destDir: `${this.name}/config`,
        annotation: 'Funnel (config)',
      });
    }

    return this._cachedConfigTree;
  }

  /**
    @private
    @method _processedEmberCLITree
    @return
  */
  _processedEmberCLITree() {
    if (!this._cachedEmberCLITree) {
      let files = [
        'vendor-prefix.js',
        'vendor-suffix.js',
        'app-prefix.js',
        'app-suffix.js',
        'app-config.js',
        'app-boot.js',
        'test-support-prefix.js',
        'test-support-suffix.js',
        'tests-prefix.js',
        'tests-suffix.js',
      ];
      let emberCLITree = new ConfigReplace(new UnwatchedDir(__dirname), this._configTree(), {
        configPath: path.join(this.name, 'config', 'environments', `${this.env}.json`),
        files,

        patterns: this._configReplacePatterns(),
      });

      this._cachedEmberCLITree = new Funnel(emberCLITree, {
        files,
        srcDir: '/',
        destDir: '/vendor/ember-cli/',
        annotation: 'Funnel (ember-cli-tree)',
      });
    }

    return this._cachedEmberCLITree;
  }

  /**
    Returns the tree for the app and its dependencies

    @private
    @method appAndDependencies
    @return {Tree} Merged tree
  */
  appAndDependencies() {
    let config = this._configTree();
    let templates = this._processedTemplatesTree();

    let srcTree = this._processedSrcTree();
    let trees = [this._processedAppTree(), srcTree, templates].filter(Boolean);

    let app = this.addonPreprocessTree('js', mergeTrees(
      trees,
      {
        annotation: 'TreeMerger (preprocessedApp & templates)',
        overwrite: true,
      }
    ));

    let external = this._processedExternalTree();
    let preprocessedApp = preprocessJs(app, '/', this.name, {
      registry: this.registry,
    });

    let postprocessedApp = this.addonPostprocessTree('js', preprocessedApp);
    let emberCLITree = this._processedEmberCLITree();

    let sourceTrees = [
      external,
      postprocessedApp,
      config,
      emberCLITree,
    ];

    return mergeTrees(sourceTrees, {
      overwrite: true,
      annotation: 'TreeMerger (appAndDependencies)',
    });
  }

  test() {
    let tests = this.addonPreprocessTree('test', this._processedTestsTree());
    let preprocessedTests = preprocessJs(tests, '/tests', this.name, {
      registry: this.registry,
    });
    let coreTestTree = this.addonPostprocessTree('test', preprocessedTests);

    let appTestTree = this.appTests(coreTestTree);
    let testFilesTree = this.testFiles(coreTestTree);

    return mergeTrees([appTestTree, testFilesTree], {
      annotation: 'TreeMerger (test)',
    });
  }

  /**
    @private
    @method appTests
  */
  appTests(coreTestTree) {
    let appTestTrees = [].concat(
      this.hinting && this.lintTestTrees(),
      this._processedEmberCLITree(),
      coreTestTree
    ).filter(Boolean);

    appTestTrees = mergeTrees(appTestTrees, {
      overwrite: true,
      annotation: 'TreeMerger (appTestTrees)',
    });

    return this._concatFiles(appTestTrees, {
      inputFiles: [`${this.name}/tests/**/*.js`],
      headerFiles: ['vendor/ember-cli/tests-prefix.js'],
      footerFiles: ['vendor/ember-cli/tests-suffix.js'],
      outputFile: this.options.outputPaths.tests.js,
      annotation: 'Concat: App Tests',
    });
  }

  /**
    Runs the `app`, `tests` and `templates` trees through the chain of addons that produces lint trees.

    Those lint trees are afterwards funneled into the `tests` folder, babel-ified and returned as an array.

    @private
    @method lintTestsTrees
    @return {Array}
   */
  lintTestTrees() {
    let lintTrees = [];

    let appTree = this._filterAppTree();
    if (appTree) {
      let lintedApp = this.addonLintTree('app', appTree);
      lintedApp = processModulesOnly(new Funnel(lintedApp, {
        srcDir: '/',
        destDir: `${this.name}/tests/`,
        annotation: 'Funnel (lint app)',
      }), 'Babel: lintTree(app)');

      lintTrees.push(lintedApp);
    }

    if (experiments.MODULE_UNIFICATION && this.trees.src) {
      let lintedSrc = this.addonLintTree('src', this.trees.src);
      lintedSrc = processModulesOnly(new Funnel(lintedSrc, {
        srcDir: '/',
        destDir: `${this.name}/tests/src/`,
        annotation: 'Funnel (lint src)',
      }), 'Babel: lintTree(src)');

      lintTrees.push(lintedSrc);
    }

    let lintedTests = this.addonLintTree('tests', this.trees.tests);
    let lintedTemplates = this.addonLintTree('templates', this._templatesTree());

    lintedTests = processModulesOnly(new Funnel(lintedTests, {
      srcDir: '/',
      destDir: `${this.name}/tests/`,
      annotation: 'Funnel (lint tests)',
    }), 'Babel: lintTree(tests)');

    lintedTemplates = processModulesOnly(new Funnel(lintedTemplates, {
      srcDir: '/',
      destDir: `${this.name}/tests/`,
      annotation: 'Funnel (lint templates)',
    }), 'Babel: lintTree(templates)');

    return [lintedTests, lintedTemplates].concat(lintTrees);
  }

  /**
   * @private
   * @method _addonInstalled
   * @param  {String} addonName The name of the addon we are checking to see if it's installed
   * @return {Boolean}
   */
  _addonInstalled(addonName) {
    return !!this.registry.availablePlugins[addonName];
  }

  /**
    Returns the tree for javascript files

    @private
    @method javascript
    @return {Tree} Merged tree
  */
  javascript() {
    let deprecate = this.project.ui.writeDeprecateLine.bind(this.project.ui);
    let applicationJs = this.appAndDependencies();

    if (this.legacyFilesToAppend.length > 0) {
      deprecate(`Usage of EmberApp.legacyFilesToAppend is deprecated. ` +
        `Please use EmberApp.import instead for the following files: '${this.legacyFilesToAppend.join('\', \'')}'`);

      this.legacyFilesToAppend.forEach(legacyFile => {
        this.import(legacyFile);
      });
    }

    let vendorFilePath = this.options.outputPaths.vendor.js;
    this._scriptOutputFiles[vendorFilePath].unshift('vendor/ember-cli/vendor-prefix.js');

    return this.bundler.bundleJs(applicationJs, {
      scriptOutputFiles: this._scriptOutputFiles,
    });
  }

  /**
    Returns the tree for styles

    @private
    @method styles
    @return {Tree} Merged tree for styles
  */
  styles() {
    if (!this._cachedStylesTree) {
      if (existsSync(`${this._stylesPath}/${this.name}.css`)) {
        throw new SilentError(`Style file cannot have the name of the application - ${this.name}`);
      }

      let addonTrees = this.addonTreesFor('styles');
      let external = this._processedExternalTree();
      let styles = new Funnel(this.trees.styles, {
        srcDir: '/',
        destDir: '/app/styles',
        annotation: 'Funnel (styles)',
      });

      let trees = [external].concat(addonTrees, styles);

      let options = { outputPaths: this.options.outputPaths.app.css };
      options.registry = this.registry;

      let stylesAndVendor = this.addonPreprocessTree('css', mergeTrees(trees, {
        annotation: 'TreeMerger (stylesAndVendor)',
        overwrite: true,
      }));

      let preprocessedStyles = preprocessCss(stylesAndVendor, '/app/styles', '/assets', options);

      if (this.vendorStaticStyles.length > 0) {
        this.project.ui.writeDeprecateLine(`Usage of EmberApp.vendorStaticStyles is deprecated. Please use EmberApp.import instead for the following files: '${this.vendorStaticStyles.join('\', \'')}'`);
        this.vendorStaticStyles.forEach(filename => this.import(filename));
      }

      let vendorStyles = [];
      for (let outputFile in this._styleOutputFiles) {
        let isMainVendorFile = outputFile === this.options.outputPaths.vendor.css;
        let headerFiles = this._styleOutputFiles[outputFile];
        let inputFiles = isMainVendorFile ? ['addon-tree-output/**/*.css'] : [];

        vendorStyles.push(this._concatFiles(stylesAndVendor, {
          headerFiles,
          inputFiles,
          outputFile,
          allowNone: true,
          annotation: `Concat: Vendor Styles${outputFile}`,
        }));
      }

      vendorStyles = this.addonPreprocessTree('css', mergeTrees(vendorStyles, {
        annotation: 'TreeMerger (vendorStyles)',
        overwrite: true,
      }));

      if (this.options.minifyCSS.enabled === true) {
        options = this.options.minifyCSS.options || {};
        options.registry = this.registry;
        preprocessedStyles = preprocessMinifyCss(preprocessedStyles, options);
        vendorStyles = preprocessMinifyCss(vendorStyles, options);
      }

      let mergedTrees = mergeTrees([
        preprocessedStyles,
        vendorStyles,
      ], {
        annotation: 'styles',
      });

      this._cachedStylesTree = this.addonPostprocessTree('css', mergedTrees);
    }

    return this._cachedStylesTree;
  }

  /**
    Returns the tree for test files

    @private
    @method testFiles
    @return {Tree} Merged tree for test files
   */
  testFiles(coreTestTree) {
    let testSupportPath = this.options.outputPaths.testSupport.js;

    testSupportPath = testSupportPath.testSupport || testSupportPath;

    let external = this._processedExternalTree();
    let emberCLITree = this._processedEmberCLITree();

    let addonTestSupportTree = mergeTrees(this.addonTreesFor('addon-test-support'), {
      overwrite: true,
      annotation: 'TreeMerger (addon-test-support)',
    });

    let finalAddonTestSupportTree = new Funnel(addonTestSupportTree, {
      allowEmpty: true,
      destDir: 'addon-test-support',
      annotation: 'Funnel: Addon Test Support',
    });

    let headerFiles = [].concat(
      'vendor/ember-cli/test-support-prefix.js',
      this.legacyTestFilesToAppend
    );

    let inputFiles = ['addon-test-support/**/*.js'];

    let footerFiles = ['vendor/ember-cli/test-support-suffix.js'];

    let baseMergedTree = mergeTrees([emberCLITree, external, coreTestTree, finalAddonTestSupportTree]);
    let testJs = this._concatFiles(baseMergedTree, {
      headerFiles,
      inputFiles,
      footerFiles,
      outputFile: testSupportPath,
      annotation: 'Concat: Test Support JS',
      allowNone: true,
    });

    let testemPath = path.join(__dirname, 'testem');
    testemPath = path.dirname(testemPath);

    let testemTree = new Funnel(new UnwatchedDir(testemPath), {
      files: ['testem.js'],
      srcDir: '/',
      destDir: '/',
      annotation: 'Funnel (testem)',
    });

    if (this.options.fingerprint && this.options.fingerprint.exclude) {
      this.options.fingerprint.exclude.push('testem');
    }

    let sourceTrees = [
      testemTree,
      testJs,
    ];

    let bowerDeps = this.project.bowerDependencies();
    if (bowerDeps['ember-cli-test-loader']) {
      this.project.ui.writeDeprecateLine('ember-cli-test-loader should now be included as an NPM module with version 1.1.0 or greater.');
      let testLoaderPath = this.options.outputPaths.testSupport.js.testLoader;
      let testLoader = new Funnel(external, {
        files: ['test-loader.js'],
        srcDir: `/${this.bowerDirectory}/ember-cli-test-loader`,
        destDir: path.dirname(testLoaderPath),
        annotation: 'Funnel (testLoader)',
      });

      sourceTrees.push(testLoader);
    }

    if (this.vendorTestStaticStyles.length > 0) {
      sourceTrees.push(
        this._concatFiles(external, {
          headerFiles: this.vendorTestStaticStyles,
          outputFile: this.options.outputPaths.testSupport.css,
          annotation: 'Concat: Test Support CSS',
        })
      );
    }

    return mergeTrees(sourceTrees, {
      overwrite: true,
      annotation: 'TreeMerger (testFiles)',
    });
  }

  /**
    Returns the tree for the additional assets which are not in
    one of the default trees.

    @private
    @method otherAssets
    @return {Tree} Merged tree for other assets
   */
  otherAssets() {
    let external = this._processedExternalTree();
    // combine obviously shared funnels.
    let otherAssetTrees = funnelReducer(this.otherAssetPaths).map(options => {
      options.annotation = `Funnel
    ${options.srcDir}
    ${options.destDir}
   include:${options.include.length}`;

      return new Funnel(external, options);
    });

    return mergeTrees(otherAssetTrees, {
      annotation: 'TreeMerger (otherAssetTrees)',
    });
  }

  /**
    @public
    @method dependencies
    @return {Object} Alias to the project's dependencies function
  */
  dependencies(pkg) {
    return this.project.dependencies(pkg);
  }

  /**
    Imports an asset into the application.

    @public
    @method import
    @param {Object|String} asset Either a path to the asset or an object with environment names and paths as key-value pairs.
    @param {Object} [options] Options object
    @param {String} [options.type='vendor'] Either 'vendor' or 'test'
    @param {Boolean} [options.prepend=false] Whether or not this asset should be prepended
    @param {String} [options.destDir] Destination directory, defaults to the name of the directory the asset is in
    @param {String} [options.outputFile] Specifies the output file for given import. Defaults to assets/vendor.{js,css}
    @param {Array} [options.using] Specifies the array of transformations to be done on the asset. Can do an amd shim and/or custom transformation
    */
  import(asset, options) {
    let assetPath = this._getAssetPath(asset);

    if (!assetPath) {
      return;
    }

    options = defaultsDeep(options || {}, {
      type: 'vendor',
      prepend: false,
    });

    let match = assetPath.match(/^node_modules\/((@[^/]+\/)?[^/]+)\//);
    if (match !== null) {
      let basedir = options.resolveFrom || this.project.root;
      let name = match[1];
      let _path = path.dirname(resolve.sync(`${name}/package.json`, { basedir }));
      this._nodeModules.set(_path, { name, path: _path });
    }

    let directory = path.dirname(assetPath);
    let subdirectory = directory.replace(new RegExp(`^vendor/|${this.bowerDirectory}|node_modules/`), '');
    let extension = path.extname(assetPath);

    if (!extension) {
      throw new Error('You must pass a file to `app.import`. For directories specify them to the constructor under the `trees` option.');
    }

    this._import(
      assetPath,
      options,
      directory,
      subdirectory,
      extension
    );
  }

  /**
    @private
    @method _import
    @param {String} assetPath
    @param {Object} options
    @param {String} directory
    @param {String} subdirectory
    @param {String} extension
   */
  _import(assetPath, options, directory, subdirectory, extension) {
    // TODO: refactor, this has gotten very messy. Relevant tests: tests/unit/broccoli/ember-app-test.js
    let basename = path.basename(assetPath);

    if (isType(assetPath, 'js', { registry: this.registry })) {
      if (options.using) {
        if (!Array.isArray(options.using)) {
          throw new Error('You must pass an array of transformations for `using` option');
        }
        options.using.forEach(entry => {
          if (!entry.transformation) {
            throw new Error(`while importing ${assetPath}: each entry in the \`using\` list must have a \`transformation\` name`);
          }

          let transformName = entry.transformation;

          if (!this._customTransformsMap.has(transformName)) {
            let availableTransformNames = Array.from(this._customTransformsMap.keys()).join(',');
            throw new Error(`while import ${assetPath}: found an unknown transformation name ${transformName}. Available transformNames are: ${availableTransformNames}`);
          }

          // process options for the transform and update the options
          let customTransforms = this._customTransformsMap.get(transformName);
          customTransforms.options = customTransforms.processOptions(
            assetPath,
            entry,
            customTransforms.options
          );
          customTransforms.files.push(assetPath);
        });
      }

      if (options.type === 'vendor') {
        options.outputFile = options.outputFile || this.options.outputPaths.vendor.js;
        addOutputFile('firstOneWins', this._scriptOutputFiles, assetPath, options);
      } else if (options.type === 'test') {
        if (!allowImport('firstOneWins', this.legacyTestFilesToAppend, assetPath, options)) { return; }
        if (options.prepend) {
          this.legacyTestFilesToAppend.unshift(assetPath);
        } else {
          this.legacyTestFilesToAppend.push(assetPath);
        }
      } else {
        throw new Error(`You must pass either \`vendor\` or \`test\` for options.type in your call to \`app.import\` for file: ${basename}`);
      }
    } else if (extension === '.css') {
      if (options.type === 'vendor') {
        options.outputFile = options.outputFile || this.options.outputPaths.vendor.css;
        addOutputFile('lastOneWins', this._styleOutputFiles, assetPath, options);
      } else {
        if (!allowImport('lastOneWins', this.vendorTestStaticStyles, assetPath, options)) { return; }
        if (options.prepend) {
          this.vendorTestStaticStyles.unshift(assetPath);
        } else {
          this.vendorTestStaticStyles.push(assetPath);
        }
      }
    } else {
      let destDir = options.destDir;
      if (destDir === '') {
        destDir = '/';
      }
      this.otherAssetPaths.push({
        src: directory,
        file: basename,
        dest: destDir || subdirectory,
      });
    }
  }

  /**
    @private
    @method _getAssetPath
    @param {(Object|String)} asset
    @return {(String|undefined)} assetPath
   */
  _getAssetPath(asset) {
    /* @type {String} */
    let assetPath;

    if (typeof asset !== 'object') {
      assetPath = asset;
    } else if (this.env in asset) {
      assetPath = asset[this.env];
    } else {
      assetPath = asset.development;
    }

    if (!assetPath) {
      return;
    }

    assetPath = assetPath.split('\\').join('/');

    if (assetPath.split('/').length < 2) {
      console.log(chalk.red(`Using \`app.import\` with a file in the root of \`vendor/\` causes a significant performance penalty. Please move \`${assetPath}\` into a subdirectory.`));
    }

    if (/[*,]/.test(assetPath)) {
      throw new Error(`You must pass a file path (without glob pattern) to \`app.import\`.  path was: \`${assetPath}\``);
    }

    return assetPath;
  }

  /**
    Returns an array of trees for this application

    @private
    @method toArray
    @return {Array} An array of trees
   */
  toArray() {
    let sourceTrees = [
      this.index(),
      this.javascript(),
      this.styles(),
      // undefined when `experiments.MODULE_UNIFICATION` is not available
      this._srcAfterStylePreprocessing,
      this.otherAssets(),
      this.publicTree(),
    ].filter(Boolean);

    if (this.tests && this.trees.tests) {
      sourceTrees = sourceTrees.concat(this.testIndex(), this.test());
    }

    return sourceTrees;
  }

  /**
    Returns the merged tree for this application

    @public
    @method toTree
    @param  {Array} additionalTrees Array of additional trees to merge
    @return {Tree}                  Merged tree for this application
   */
  toTree(additionalTrees) {
    let tree = mergeTrees(this.toArray().concat(additionalTrees || []), {
      overwrite: true,
      annotation: 'TreeMerger (allTrees)',
    });

    return this.addonPostprocessTree('all', tree);
  }

  /**
    Returns the content for a specific type (section) for index.html.

    Currently supported types:
    - 'head'
    - 'config-module'
    - 'head-footer'
    - 'test-header-footer'
    - 'body-footer'
    - 'test-body-footer'

    Addons can also implement this method and could also define additional
    types (eg. 'some-addon-section').

    @private
    @method contentFor
    @param  {Object} config Application configuration
    @param  {RegExp} match  Regular expression to match against
    @param  {String} type   Type of content
    @return {String}        The content.
   */
  contentFor(config, match, type) {
    let content = [];
    let deprecatedHooks = ['app-prefix', 'app-suffix', 'vendor-prefix', 'vendor-suffix'];
    let deprecate = this.project.ui.writeDeprecateLine.bind(this.project.ui);

    // This normalizes `rootURL` to the value which we use everywhere inside of Ember CLI.
    // This makes sure that the user doesn't have to account for it in application code.
    if ('rootURL' in config) {
      config.rootURL = calculateRootURL(config);
    }

    switch (type) {
      case 'head': this._contentForHead(content, config); break;
      case 'config-module': this._contentForConfigModule(content, config); break;
      case 'app-boot': this._contentForAppBoot(content, config); break;
      case 'test-body-footer': this._contentForTestBodyFooter(content); break;
    }

    content = this.project.addons.reduce((content, addon) => {
      let addonContent = addon.contentFor ? addon.contentFor(type, config, content) : null;
      if (addonContent) {
        deprecate(`The \`${type}\` hook used in ${addon.name} is deprecated. The addon should generate a module and have consumers \`require\` it.`, deprecatedHooks.indexOf(type) === -1);
        return content.concat(addonContent);
      }

      return content;
    }, content);

    return content.join('\n');
  }

  /**
    @private
    @method _contentForTestBodyFooter
    @param {Array} content
  */
  _contentForTestBodyFooter(content) {
    content.push('<script>Ember.assert(\'The tests file was not loaded. Make sure your tests index.html includes "assets/tests.js".\', EmberENV.TESTS_FILE_LOADED);</script>');
  }

  /**
    @private
    @method _contentForHead
    @param {Array} content
    @param {Object} config
  */
  _contentForHead(content, config) {
    content.push(calculateBaseTag(config));

    if (this.options.storeConfigInMeta) {
      content.push(`<meta name="${config.modulePrefix}/config/environment" content="${escape(JSON.stringify(config))}" />`);
    }
  }

  /**
    @private
    @method _contentForConfigModule
    @param {Array} content
    @param {Object} config
  */
  _contentForConfigModule(content, config) {
    if (this.options.storeConfigInMeta) {
      content.push(`var prefix = '${config.modulePrefix}';`);
      content.push(fs.readFileSync(path.join(__dirname, 'app-config-from-meta.js')));
    } else {
      content.push(`var exports = {'default': ${JSON.stringify(config)}};` +
        `Object.defineProperty(exports, '__esModule', {value: true});` +
        `return exports;`);
    }
  }

  /**
    @private
    @method _contentForAppBoot
    @param {Array} content
    @param {Object} config
  */
  _contentForAppBoot(content, config) {
    if (this.options.autoRun) {
      let shouldUseSrc = experiments.MODULE_UNIFICATION && !!this.trees.src;
      let moduleToRequire = `${config.modulePrefix}/${shouldUseSrc ? 'src/main' : 'app'}`;
      content.push('if (!runningTests) {');
      content.push(`  require("${moduleToRequire}")["default"].create(${calculateAppConfig(config)});`);
      content.push('}');
    }
  }
}

module.exports = EmberApp;

/*
  Returns the <base> tag for index.html

  @param  {Object} config Application configuration
  @return {String}        Base tag or empty string
 */
function calculateBaseTag(config) {
  let baseURL = cleanBaseURL(config.baseURL);
  let locationType = config.locationType;

  if (locationType === 'hash') {
    return '';
  }

  if (baseURL) {
    return `<base href="${baseURL}" />`;
  } else {
    return '';
  }
}

function calculateRootURL(config) {
  if (config.rootURL === '') {
    return config.rootURL;
  }

  return cleanBaseURL(config.rootURL) || '';
}

function calculateEmberENV(config) {
  return JSON.stringify(config.EmberENV || {});
}

function calculateAppConfig(config) {
  return JSON.stringify(config.APP || {});
}

function calculateModulePrefix(config) {
  return config.modulePrefix;
}

function addOutputFile(strategy, container, assetPath, options) {
  let outputFile = options.outputFile;

  if (!outputFile) {
    throw new Error('outputFile is not specified');
  }

  if (!container[outputFile]) {
    container[outputFile] = [];
  }
  if (!allowImport(strategy, container[outputFile], assetPath, options)) { return; }

  if (options.prepend) {
    container[outputFile].unshift(assetPath);
  } else {
    container[outputFile].push(assetPath);
  }
}

// In this strategy the last instance of the asset in the array is the one which will be used.
// This applies to CSS where the last asset always "wins" no matter what.
function _lastOneWins(fileList, assetPath, options) {
  let assetIndex = fileList.indexOf(assetPath);

  // Doesn't exist in the current fileList. Safe to remove.
  if (assetIndex === -1) { return true; }

  logger.info(`Highlander Rule: duplicate \`app.import(${assetPath})\`. Only including the last by order.`);

  if (options.prepend) {
    // The existing asset is _already after_ this inclusion and would win.
    // Therefore this branch is a no-op.
    return false;
  } else {
    // The existing asset is _before_ this inclusion and needs to be removed.
    fileList.splice(fileList.indexOf(assetPath), 1);
    return true;
  }
}

// In JS the asset which would be first will win.
// If it is something which includes globals we want those defined as early as
// possible. Any initialization would likely be repeated. Any mutation of global
// state that occurs on initialization is likely _fixed_.
// Any module definitions will be identical except in the scenario where they'red
// reified to reassignment. This is likely fine.
function _firstOneWins(fileList, assetPath, options) {
  let assetIndex = fileList.indexOf(assetPath);

  // Doesn't exist in the current fileList. Safe to remove.
  if (assetIndex === -1) { return true; }

  logger.info(`Highlander Rule: duplicate \`app.import(${assetPath})\`. Only including the first by order.`);

  if (options.prepend) {
    // The existing asset is _after_ this inclusion and needs to be removed.
    fileList.splice(fileList.indexOf(assetPath), 1);
    return true;
  } else {
    // The existing asset is _already before_ this inclusion and would win.
    // Therefore this branch is a no-op.
    return false;
  }
}

function allowImport(strategy, fileList, assetPath, options) {
  if (strategy === 'firstOneWins') {
    // We must find all occurrences and decide what to do with each.
    return _firstOneWins.call(undefined, fileList, assetPath, options);
  } else if (strategy === 'lastOneWins') {
    // We can simply use the "last one wins" strategy.
    return _lastOneWins.call(undefined, fileList, assetPath, options);
  } else {
    return true;
  }
}
