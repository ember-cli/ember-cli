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
const escapeRegExp = require('escape-string-regexp');
const crypto = require('crypto');

const Project = require('../models/project');
const cleanBaseURL = require('clean-base-url');
const SilentError = require('silent-error');

let preprocessJs = p.preprocessJs;
let preprocessCss = p.preprocessCss;
let isType = p.isType;

let preprocessTemplates = p.preprocessTemplates;

let preprocessMinifyCss = p.preprocessMinifyCss;

const Babel = require('broccoli-babel-transpiler');
const concat = require('broccoli-concat');

const ConfigReplace = require('broccoli-config-replace');
const ConfigLoader = require('broccoli-config-loader');
const mergeTrees = require('./merge-trees');
const shimAmd = require('./amd-shim');
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

let SECRET_DEPRECATION_PREVENTION_SYMBOL = crypto.randomBytes(8).toString('hex');

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

module.exports = EmberApp;

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
function EmberApp(defaults, options) {
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

  this._styleOutputFiles = {};
  this._scriptOutputFiles = {};
  this.amdModuleNames = null;

  this.legacyFilesToAppend = [];
  this.vendorStaticStyles = [];
  this.otherAssetPaths = [];
  this.legacyTestFilesToAppend = [];
  this.vendorTestStaticStyles = [];

  this.trees = this.options.trees;

  this.populateLegacyFiles();
  p.setupRegistry(this);
  this._notifyAddonIncluded();

  if (!this._addonInstalled('loader.js') && !this.options._ignoreMissingLoader) {
    throw new SilentError('The loader.js addon is missing from your project, please add it to `package.json`.');
  }
}

/**
  Initializes the `tests` and `hinting` properties.

  Defaults to `false` unless `ember test` was used or this is *not* a production build.

  @private
  @method _initTestsAndHinting
  @param {Object} options
*/
EmberApp.prototype._initTestsAndHinting = function(options) {
  let testsEnabledDefault = process.env.EMBER_CLI_TEST_COMMAND || !this.isProduction;

  this.tests = options.hasOwnProperty('tests') ? options.tests : testsEnabledDefault;
  this.hinting = options.hasOwnProperty('hinting') ? options.hinting : testsEnabledDefault;
};

/**
  Initializes the `project` property from `options.project` or the
  closest Ember CLI project from the current working directory.

  @private
  @method _initProject
  @param {Object} options
*/
EmberApp.prototype._initProject = function(options) {
  let app = this;

  this.project = options.project || Project.closestSync(process.cwd());

  if (options.configPath) {
    this.project.configPath = function() { return app._resolveLocal(options.configPath); };
  }
};

/**
  Initializes the `options` property from the `options` parameter and
  a set of default values from Ember CLI.

  @private
  @method _initOptions
  @param {Object} options
*/
EmberApp.prototype._initOptions = function(options) {
  let appTree = new WatchedDir(this._resolveLocal('app'));

  let testsPath = this._resolveLocal('tests');
  let testsTree = existsSync(testsPath) ? new WatchedDir(testsPath) : null;

  // these are contained within app/ no need to watch again
  // (we should probably have the builder or the watcher dedup though)
  let stylesTree = new UnwatchedDir(this._resolveLocal('app/styles'));
  let templatesPath = this._resolveLocal('app/templates');
  let templatesTree = existsSync(templatesPath) ? new UnwatchedDir(templatesPath) : null;

  // do not watch bower's default directory by default
  let bowerTree = this.project._watchmanInfo.enabled ? this.bowerDirectory : new UnwatchedDir(this.bowerDirectory);

  let vendorPath = this._resolveLocal('vendor');
  let vendorTree = existsSync(vendorPath) ? new WatchedDir(vendorPath) : null;

  let publicPath = this._resolveLocal('public');
  let publicTree = existsSync(publicPath) ? new WatchedDir(publicPath) : null;

  let detectedDefaultOptions = {
    babel: {
      modules: 'amdStrict',
      moduleIds: true,
      resolveModuleSource: require('amd-name-resolver').moduleResolve,
    },
    jshintrc: {
      app: this.project.root,
      tests: this._resolveLocal('tests'),
    },
    minifyCSS: {
      enabled: this.isProduction,
      options: { processImport: false },
    },
    minifyJS: {
      enabled: this.isProduction,
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

  // For now we must disable Babel sourcemaps due to unforseen
  // performance regressions.
  if (!('sourceMaps' in this.options.babel)) {
    this.options.babel.sourceMaps = false;
  }
};

/**
  Resolves a path relative to the project's root

  @private
  @method _resolveLocal
*/
EmberApp.prototype._resolveLocal = function(to) {
  return path.join(this.project.root, to);
};

/**
  @private
  @method _initVendorFiles
*/
EmberApp.prototype._initVendorFiles = function() {
  let bowerDeps = this.project.bowerDependencies();
  let ember = this.project.findAddonByName('ember-source');
  let addonEmberCliShims = this.project.findAddonByName('ember-cli-shims');
  let bowerEmberCliShims = bowerDeps['ember-cli-shims'];
  let developmentEmber;
  let productionEmber;
  let emberShims = null;
  let jquery;

  if (ember) {
    developmentEmber = ember.paths.debug;
    productionEmber = ember.paths.prod;
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
      `${this.bowerDirectory}/ember/ember-testing.js`,
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

  // this is needed to support versions of Ember older than
  // 1.8.0 (when ember-testing.js was added to the deployment)
  if (this.vendorFiles['ember-testing.js'] && !existsSync(this.vendorFiles['ember-testing.js'][0])) {
    delete this.vendorFiles['ember-testing.js'];
  }
};

/**
  Returns the environment name

  @public
  @static
  @method env
  @return {String} Environment name
 */
EmberApp.env = function() {
  return process.env.EMBER_ENV || 'development';
};

/**
  Provides a broccoli files concatenation filter that's configured
  properly for this application.

  @deprecated
  @method concatFiles
  @param tree
  @param options
  @return
*/
EmberApp.prototype.concatFiles = function(tree, options) {
  this.project.ui.writeDeprecateLine('EmberApp.concatFiles() is deprecated. Please use the `broccoli-concat` module directly.',
    arguments[2] === SECRET_DEPRECATION_PREVENTION_SYMBOL);

  options.sourceMapConfig = this.options.sourcemaps;

  return concat(tree, options);
};

/**
  Delegates to `broccoli-concat` with the `sourceMapConfig` option set to `options.sourcemaps`.

  @private
  @method _concatFiles
  @param tree
  @param options
  @return
*/
EmberApp.prototype._concatFiles = function(tree, options) {
  return this.concatFiles(tree, options, SECRET_DEPRECATION_PREVENTION_SYMBOL);
};

/**
  Checks the result of `addon.isEnabled()` if it exists, defaults to `true` otherwise.

  @private
  @method _addonEnabled
  @param {Addon} addon
  @return {Boolean}
*/
EmberApp.prototype._addonEnabled = function(addon) {
  return !addon.isEnabled || addon.isEnabled();
};

/**
  @private
  @method _addonDisabledByBlacklist
  @param {Addon} addon
  @return {Boolean}
*/
EmberApp.prototype._addonDisabledByBlacklist = function(addon) {
  let blacklist = this.options.addons.blacklist;
  return !!blacklist && blacklist.indexOf(addon.name) !== -1;
};

/**
  @private
  @method _addonDisabledByWhitelist
  @param {Addon} addon
  @return {Boolean}
*/
EmberApp.prototype._addonDisabledByWhitelist = function(addon) {
  let whitelist = this.options.addons.whitelist;
  return !!whitelist && whitelist.indexOf(addon.name) === -1;
};

/**
  Returns whether an addon should be added to the project

  @private
  @method shouldIncludeAddon
  @param {Addon} addon
  @return {Boolean}
*/
EmberApp.prototype.shouldIncludeAddon = function(addon) {
  if (!this._addonEnabled(addon)) {
    return false;
  }

  return !this._addonDisabledByBlacklist(addon) && !this._addonDisabledByWhitelist(addon);
};



/**
  @private
  @method _notifyAddonIncluded
*/
EmberApp.prototype._notifyAddonIncluded = function() {
  this.initializeAddons();

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

  this.project.addons = this.project.addons.filter(function(addon) {
    addon.app = this;

    if (this.shouldIncludeAddon(addon)) {
      if (addon.included) {
        addon.included(this);
      }

      return addon;
    }
  }, this);
};

/**
  Loads and initializes addons for this project.
  Calls initializeAddons on the Project.

  @private
  @method initializeAddons
*/
EmberApp.prototype.initializeAddons = function() {
  this.project.initializeAddons();
};

/**
  Returns a list of trees for a given type, returned by all addons.

  @private
  @method addonTreesFor
  @param  {String} type Type of tree
  @return {Array}       List of trees
 */
EmberApp.prototype.addonTreesFor = function(type) {
  return this.project.addons.map(addon => {
    if (addon.treeFor) {
      return addon.treeFor(type);
    }
  }).filter(Boolean);
};

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
    postprocessTree: function(type, tree) {
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
EmberApp.prototype.addonPostprocessTree = function(type, tree) {
  return addonProcessTree(this.project, 'postprocessTree', type, tree);
};


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
    preprocessTree: function(type, tree) {
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
EmberApp.prototype.addonPreprocessTree = function(type, tree) {
  return addonProcessTree(this.project, 'preprocessTree', type, tree);
};

/**
  Runs addon lintTree hooks and returns a single tree containing all
  their output.

  @private
  @method addonLintTree
  @param  {String} type Type of tree
  @param  {Tree}   tree Tree to process
  @return {Tree}        Processed tree
 */
EmberApp.prototype.addonLintTree = function(type, tree) {
  let output = this.project.addons.map(addon => {
    if (addon.lintTree) {
      return addon.lintTree(type, tree);
    }
  }).filter(Boolean);

  return mergeTrees(output, {
    overwrite: true,
    annotation: `TreeMerger (lint ${type})`,
  });
};

/**
  Imports legacy imports in this.vendorFiles

  @private
  @method populateLegacyFiles
*/
EmberApp.prototype.populateLegacyFiles = function() {
  let name;
  for (name in this.vendorFiles) {
    let args = this.vendorFiles[name];

    if (args === null) { continue; }

    this.import.apply(this, [].concat(args));
  }
};

/**
  Returns the tree for app/index.html

  @private
  @method index
  @return {Tree} Tree for app/index.html
*/
EmberApp.prototype.index = function() {
  let htmlName = this.options.outputPaths.app.html;
  let files = [
    'index.html',
  ];

  let index = new Funnel(this.trees.app, {
    files,
    getDestinationPath(relativePath) {
      if (relativePath === 'index.html') {
        relativePath = htmlName;
      }
      return relativePath;
    },
    annotation: 'Funnel: index.html',
  });

  return new ConfigReplace(index, this._configTree(), {
    configPath: path.join(this.name, 'config', 'environments', `${this.env}.json`),
    files: [htmlName],
    patterns: this._configReplacePatterns(),
  });
};

/**
  Filters styles and templates from the `app` tree.

  @private
  @method _filterAppTree
  @return {Tree}
*/
EmberApp.prototype._filterAppTree = function() {
  if (this._cachedFilterAppTree) {
    return this._cachedFilterAppTree;
  }

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

  return this._cachedFilterAppTree;
};

EmberApp.prototype.podTemplates = function() {
  return new Funnel(this.trees.app, {
    include: this._podTemplatePatterns(),
    exclude: ['templates/**/*'],
    destDir: `${this.name}/`,
    annotation: 'Funnel: Pod Templates',
  });
};

EmberApp.prototype._templatesTree = function() {
  if (this._cachedTemplateTree) {
    return this._cachedTemplateTree;
  }

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

  return this._cachedTemplateTree;
};

/**
  @private
  @method _configReplacePatterns
  @return
*/
EmberApp.prototype._configReplacePatterns = function() {
  return [{
    match: /\{\{rootURL\}\}/g,
    replacement: calculateRootURL,
  }, {
    match: /\{\{EMBER_ENV\}\}/g,
    replacement: calculateEmberENV,
  }, {
    match: /\{\{content-for ['"](.+)["']\}\}/g,
    replacement: this.contentFor.bind(this),
  }, {
    match: /\{\{MODULE_PREFIX\}\}/g,
    replacement: calculateModulePrefix,
  }];
};

/**
  Returns the tree for /tests/index.html

  @private
  @method testIndex
  @return {Tree} Tree for /tests/index.html
 */
EmberApp.prototype.testIndex = function() {
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
};

/**
  Returns the tree for /public

  @private
  @method publicTree
  @return {Tree} Tree for /public
 */
EmberApp.prototype.publicTree = function() {
  let trees = this.addonTreesFor('public');

  if (this.trees.public) {
    trees.push(this.trees.public);
  }

  return mergeTrees(trees, {
    overwrite: true,
    annotation: 'TreeMerge (public)',
  });
};


/**
  @private
  @method _processedAppTree
  @return
*/
EmberApp.prototype._processedAppTree = function() {
  let addonTrees = this.addonTreesFor('app');
  let mergedApp = mergeTrees(addonTrees.concat(this._filterAppTree()), {
    overwrite: true,
    annotation: 'TreeMerger (app)',
  });

  return new Funnel(mergedApp, {
    srcDir: '/',
    destDir: this.name,
    annotation: 'ProcessedAppTree',
  });
};

/**
  @private
  @method _processedTemplatesTree
  @return
*/
EmberApp.prototype._processedTemplatesTree = function() {
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
};

/**
  @private
  @method _podTemplatePatterns
  @return {Array} An array of regular expressions.
*/
EmberApp.prototype._podTemplatePatterns = function() {
  return this.registry.extensionsForType('template')
    .map(extension => `**/*/template.${extension}`);
};

/**
  @private
  @method _processedTestsTree
  @return
*/
EmberApp.prototype._processedTestsTree = function() {
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
};

/**
  @private
  @method _processedBowerTree
  @return
*/
EmberApp.prototype._processedBowerTree = function() {
  if (this._cachedBowerTree) {
    return this._cachedBowerTree;
  }

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

  return this._cachedBowerTree;
};

EmberApp.prototype._addonTree = function _addonTree() {
  if (this._cachedAddonTree) {
    return this._cachedAddonTree;
  }

  let addonTrees = mergeTrees(this.addonTreesFor('addon'), {
    overwrite: true,
    annotation: 'TreeMerger (addons)',
  });

  let addonTranspiledModules = new Funnel(addonTrees, {
    srcDir: 'modules',
    allowEmpty: true,
    annotation: 'Funnel: Addon JS',
  });

  return this._cachedAddonTree = [
    this._concatFiles(addonTrees, {
      inputFiles: ['**/*.css'],
      outputFile: '/addons.css',
      allowNone: true,
      annotation: 'Concat: Addon CSS',
    }),

    this._concatFiles(addonTranspiledModules, {
      inputFiles: ['**/*.js'],
      outputFile: '/addons.js',
      allowNone: true,
      annotation: 'Concat: Addon JS',
    }),
  ];
};

/**
  @private
  @method _processedVendorTree
  @return
*/
EmberApp.prototype._processedVendorTree = function() {
  if (this._cachedVendorTree) {
    return this._cachedVendorTree;
  }

  let trees = this._addonTree();
  trees = trees.concat(this.addonTreesFor('vendor'));

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

  return this._cachedVendorTree;
};

/**
  @private
  @method _processedExternalTree
  @return
*/
EmberApp.prototype._processedExternalTree = function() {
  if (this._cachedExternalTree) {
    return this._cachedExternalTree;
  }

  let vendor = this._processedVendorTree();
  let bower = this._processedBowerTree();

  let trees = [vendor];
  if (bower) {
    trees.unshift(bower);
  }

  let externalTree = mergeTrees(trees, {
    annotation: 'TreeMerger (ExternalTree)',
  });

  if (this.amdModuleNames) {
    let anonymousAmd = new Funnel(externalTree, {
      files: Object.keys(this.amdModuleNames),
      annotation: 'Funnel (named AMD)',
    });
    externalTree = mergeTrees([externalTree, shimAmd(anonymousAmd, this.amdModuleNames)], {
      annotation: 'TreeMerger (named AMD)',
      overwrite: true,
    });
  }

  return this._cachedExternalTree = externalTree;
};

/**
  @private
  @method _configTree
  @return
*/
EmberApp.prototype._configTree = function() {
  if (this._cachedConfigTree) {
    return this._cachedConfigTree;
  }

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

  return this._cachedConfigTree;
};

/**
  @private
  @method _processedEmberCLITree
  @return
*/
EmberApp.prototype._processedEmberCLITree = function() {
  if (this._cachedEmberCLITree) {
    return this._cachedEmberCLITree;
  }

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

  return this._cachedEmberCLITree = new Funnel(emberCLITree, {
    files,
    srcDir: '/',
    destDir: '/vendor/ember-cli/',
    annotation: 'Funnel (ember-cli-tree)',
  });
};

/**
  Returns the tree for the app and its dependencies

  @private
  @method appAndDependencies
  @return {Tree} Merged tree
*/
EmberApp.prototype.appAndDependencies = function() {
  let sourceTrees = [];
  let config = this._configTree();
  let templates = this._processedTemplatesTree();

  let app = this.addonPreprocessTree('js', mergeTrees([
    this._processedAppTree(),
    templates,
  ].concat(sourceTrees), {
    annotation: 'TreeMerger (preprocessedApp & templates)',
    overwrite: true,
  }));

  let external = this._processedExternalTree();
  let preprocessedApp = preprocessJs(app, '/', this.name, {
    registry: this.registry,
  });

  let postprocessedApp = this.addonPostprocessTree('js', preprocessedApp);
  sourceTrees = sourceTrees.concat([
    external,
    postprocessedApp,
    config,
  ]);

  let emberCLITree = this._processedEmberCLITree();

  sourceTrees.push(emberCLITree);

  return mergeTrees(sourceTrees, {
    overwrite: true,
    annotation: 'TreeMerger (appAndDependencies)',
  });
};

EmberApp.prototype.test = function() {
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
};

/**
  @private
  @method appTests
*/
EmberApp.prototype.appTests = function(coreTestTree) {
  let appTestTrees = [coreTestTree];

  if (this.hinting) {
    Array.prototype.push.apply(appTestTrees, this.lintTestTrees());
  }

  appTestTrees.push(this._processedEmberCLITree());

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
};

/**
  Runs the `app`, `tests` and `templates` trees through the chain of addons that produces lint trees.

  Those lint trees are afterwards funneled into the `tests` folder, babel-ified and returned as an array.

  @private
  @method lintTestsTrees
  @return {Array}
 */
EmberApp.prototype.lintTestTrees = function() {
  let lintedApp = this.addonLintTree('app', this._filterAppTree());
  let lintedTests = this.addonLintTree('tests', this.trees.tests);
  let lintedTemplates = this.addonLintTree('templates', this._templatesTree());

  lintedApp = new Babel(new Funnel(lintedApp, {
    srcDir: '/',
    destDir: `${this.name}/tests/`,
    annotation: 'Funnel (lint app)',
  }), this._prunedBabelOptions());

  lintedTests = new Babel(new Funnel(lintedTests, {
    srcDir: '/',
    destDir: `${this.name}/tests/`,
    annotation: 'Funnel (lint tests)',
  }), this._prunedBabelOptions());

  lintedTemplates = new Babel(new Funnel(lintedTemplates, {
    srcDir: '/',
    destDir: `${this.name}/tests/`,
    annotation: 'Funnel (lint templates)',
  }), this._prunedBabelOptions());

  return [lintedApp, lintedTests, lintedTemplates];
};

/**
 * @private
 * @method _addonInstalled
 * @param  {String} addonName The name of the addon we are checking to see if it's installed
 * @return {Boolean}
 */
EmberApp.prototype._addonInstalled = function(addonName) {
  return !!this.registry.availablePlugins[addonName];
};

/**
 * Returns `options.babel` without the `compileModules` and `includePolyfill` properties.
 *
 * @private
 * @method _prunedBabelOptions
 * @return {Object} The pruned babel options
 */
EmberApp.prototype._prunedBabelOptions = function() {
  let babelOptions = merge({}, this.options.babel);
  delete babelOptions.compileModules;
  delete babelOptions.includePolyfill;
  return babelOptions;
};

/**
  Returns the tree for javascript files

  @private
  @method javascript
  @return {Tree} Merged tree
*/
EmberApp.prototype.javascript = function() {
  let deprecate = this.project.ui.writeDeprecateLine.bind(this.project.ui);
  let applicationJs = this.appAndDependencies();
  let appOutputPath = this.options.outputPaths.app.js;
  let appJs = applicationJs;

  // Note: If ember-cli-babel is installed we have already performed the transpilation at this point
  if (!this._addonInstalled('ember-cli-babel')) {
    appJs = new Babel(
      new Funnel(applicationJs, {
        include: [`${escapeRegExp(`${this.name}/`)}**/*.js`],
        annotation: 'Funnel: App JS Files',
      }),
      merge(this._prunedBabelOptions())
    );
  }

  appJs = mergeTrees([
    appJs,
    this._processedEmberCLITree(),
  ], {
    annotation: 'TreeMerger (appJS  & processedEmberCLITree)',
    overwrite: true,
  });

  appJs = this._concatFiles(appJs, {
    inputFiles: [`${this.name}/**/*.js`],
    headerFiles: [
      'vendor/ember-cli/app-prefix.js',
    ],
    footerFiles: [
      'vendor/ember-cli/app-suffix.js',
      'vendor/ember-cli/app-config.js',
      'vendor/ember-cli/app-boot.js',
    ],
    outputFile: appOutputPath,
    annotation: 'Concat: App',
  });

  if (this.legacyFilesToAppend.length > 0) {
    deprecate(`Usage of EmberApp.legacyFilesToAppend is deprecated. ` +
      `Please use EmberApp.import instead for the following files: '${this.legacyFilesToAppend.join('\', \'')}'`);

    this.legacyFilesToAppend.forEach(legacyFile => {
      this.import(legacyFile);
    });
  }

  this.import('vendor/ember-cli/vendor-prefix.js', { prepend: true });
  this.import('vendor/addons.js');
  this.import('vendor/ember-cli/vendor-suffix.js');

  let vendorFiles = [];
  for (let outputFile in this._scriptOutputFiles) {
    let headerFiles = this._scriptOutputFiles[outputFile];

    vendorFiles.push(
      this._concatFiles(applicationJs, {
        headerFiles,
        outputFile,
        separator: '\n;',
        annotation: `Concat: Vendor ${outputFile}`,
      })
    );
  }

  return mergeTrees(vendorFiles.concat(appJs), {
    annotation: 'TreeMerger (vendor & appJS)',
  });
};

/**
  Returns the tree for styles

  @private
  @method styles
  @return {Tree} Merged tree for styles
*/
EmberApp.prototype.styles = function() {
  if (this._cachedStylesTree) {
    return this._cachedStylesTree;
  }

  if (existsSync(`app/styles/${this.name}.css`)) {
    throw new SilentError(`Style file cannot have the name of the application - ${this.name}`);
  }

  let addonTrees = this.addonTreesFor('styles');
  let external = this._processedExternalTree();
  let styles = new Funnel(this.trees.styles, {
    srcDir: '/',
    destDir: '/app/styles',
    annotation: 'Funnel (styles)',
  });

  let trees = [external].concat(addonTrees);
  trees.push(styles);

  let options = { outputPaths: this.options.outputPaths.app.css };
  options.registry = this.registry;

  let stylesAndVendor = this.addonPreprocessTree('css', mergeTrees(trees, {
    annotation: 'TreeMerger (stylesAndVendor)',
    overwrite: true,
  }));

  let preprocessedStyles = preprocessCss(stylesAndVendor, '/app/styles', '/assets', options);

  if (this.vendorStaticStyles.length > 0) {
    this.project.ui.writeDeprecateLine(`Usage of EmberApp.vendorStaticStyles is deprecated. Please use EmberApp.import instead for the following files: '${this.vendorStaticStyles.join('\', \'')}'`);
    this.vendorStaticStyles.forEach(filename => {
      this.import(filename);
    });
  }

  this.import('vendor/addons.css');

  let vendorStyles = [];
  for (let outputFile in this._styleOutputFiles) {
    let headerFiles = this._styleOutputFiles[outputFile];

    vendorStyles.push(this._concatFiles(stylesAndVendor, {
      headerFiles,
      outputFile,
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

  return this._cachedStylesTree = this.addonPostprocessTree('css', mergedTrees);
};

/**
  Returns the tree for test files

  @private
  @method testFiles
  @return {Tree} Merged tree for test files
 */
EmberApp.prototype.testFiles = function(coreTestTree) {
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
};

/**
  Returns the tree for the additional assets which are not in
  one of the default trees.

  @private
  @method otherAssets
  @return {Tree} Merged tree for other assets
 */
EmberApp.prototype.otherAssets = function() {
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
};

/**
  @public
  @method dependencies
  @return {Object} Alias to the project's dependencies function
*/
EmberApp.prototype.dependencies = function(pkg) {
  return this.project.dependencies(pkg);
};

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
 */
EmberApp.prototype.import = function(asset, options) {
  let assetPath = this._getAssetPath(asset);

  if (!assetPath) {
    return;
  }

  options = defaultsDeep(options || {}, {
    type: 'vendor',
    prepend: false,
  });

  let directory = path.dirname(assetPath);
  let subdirectory = directory.replace(new RegExp(`^vendor/|${this.bowerDirectory}`), '');
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
};

/**
  @private
  @method _import
  @param {String} assetPath
  @param {Object} options
  @param {String} directory
  @param {String} subdirectory
  @param {String} extension
 */
EmberApp.prototype._import = function(assetPath, options, directory, subdirectory, extension) {
  // TODO: refactor, this has gotten very messy. Relevant tests: tests/unit/broccoli/ember-app-test.js
  let basename = path.basename(assetPath);

  if (isType(assetPath, 'js', { registry: this.registry })) {
    if (options.using) {
      let self = this;
      options.using.forEach(entry => {
        if (!entry.transformation) {
          throw new Error(`while importing ${assetPath}: each entry in the \`using\` list must have a \`transformation\` name`);
        }
        if (entry.transformation !== 'amd') {
          throw new Error(`while importing ${assetPath}: unknown transformation \`${entry.transformation}\``);
        }
        if (!entry.as) {
          throw new Error(`while importing ${assetPath}: amd transformation requires an \`as\` argument that specifies the desired module name`);
        }
        if (!self.amdModuleNames) {
          self.amdModuleNames = {};
        }
        // If the import is specified to be a different name we must break because of the broccoli rewrite behavior.
        if (self.amdModuleNames[assetPath] && self.amdModuleNames[assetPath] !== entry.as) {
          throw new Error(`Highlander error while importing ${assetPath}. You may not import an AMD transformed asset at different module names.`);
        }
        self.amdModuleNames[assetPath] = entry.as;
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
};

/**
  @private
  @method _getAssetPath
  @param {(Object|String)} asset
  @return {(String|undefined)} assetPath
 */
EmberApp.prototype._getAssetPath = function(asset) {
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

  if (/[\*\,]/.test(assetPath)) {
    throw new Error(`You must pass a file path (without glob pattern) to \`app.import\`.  path was: \`${assetPath}\``);
  }

  return assetPath;
};

/**
  Returns an array of trees for this application

  @private
  @method toArray
  @return {Array} An array of trees
 */
EmberApp.prototype.toArray = function() {
  let sourceTrees = [
    this.index(),
    this.javascript(),
    this.styles(),
    this.otherAssets(),
    this.publicTree(),
  ];

  if (this.tests && this.trees.tests) {
    sourceTrees = sourceTrees.concat(this.testIndex(), this.test());
  }

  return sourceTrees;
};

/**
  Returns the merged tree for this application

  @public
  @method toTree
  @param  {Array} additionalTrees Array of additional trees to merge
  @return {Tree}                  Merged tree for this application
 */
EmberApp.prototype.toTree = function(additionalTrees) {
  let tree = mergeTrees(this.toArray().concat(additionalTrees || []), {
    overwrite: true,
    annotation: 'TreeMerger (allTrees)',
  });

  return this.addonPostprocessTree('all', tree);
};

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
EmberApp.prototype.contentFor = function(config, match, type) {
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
};

/**
  @private
  @method _contentForTestBodyFooter
  @param {Array} content
*/
EmberApp.prototype._contentForTestBodyFooter = function(content) {
  content.push('<script>Ember.assert(\'The tests file was not loaded. Make sure your tests index.html includes "assets/tests.js".\', EmberENV.TESTS_FILE_LOADED);</script>');
};

/**
  @private
  @method _contentForHead
  @param {Array} content
  @param {Object} config
*/
EmberApp.prototype._contentForHead = function(content, config) {
  content.push(calculateBaseTag(config));

  if (this.options.storeConfigInMeta) {
    content.push(`<meta name="${config.modulePrefix}/config/environment" content="${escape(JSON.stringify(config))}" />`);
  }
};

/**
  @private
  @method _contentForConfigModule
  @param {Array} content
  @param {Object} config
*/
EmberApp.prototype._contentForConfigModule = function(content, config) {
  if (this.options.storeConfigInMeta) {
    content.push(`var prefix = '${config.modulePrefix}';`);
    content.push(fs.readFileSync(path.join(__dirname, 'app-config-from-meta.js')));
  } else {
    content.push(`var exports = \{'default': ${JSON.stringify(config)}};` +
      `Object.defineProperty(exports, '__esModule', \{value: true});` +
      `return exports;`);
  }
};

/**
  @private
  @method _contentForAppBoot
  @param {Array} content
  @param {Object} config
*/
EmberApp.prototype._contentForAppBoot = function(content, config) {
  if (this.options.autoRun) {
    content.push('if (!runningTests) {');
    content.push(`  require("${config.modulePrefix}/app")["default"].create(${calculateAppConfig(config)});`);
    content.push('}');
  }
};

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
