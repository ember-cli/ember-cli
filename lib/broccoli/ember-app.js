/* global require, module */
'use strict';

var fs    = require('fs');
var p     = require('../preprocessors');
var chalk = require('chalk');

var Project      = require('../models/project');
var cleanBaseURL = require('../utilities/clean-base-url');

var preprocessJs  = p.preprocessJs;
var preprocessCss = p.preprocessCss;
var isType        = p.isType;

var preprocessTemplates = p.preprocessTemplates;

var preprocessMinifyCss = p.preprocessMinifyCss;

var replace     = require('broccoli-string-replace');
var compileES6  = require('broccoli-es6-concatenator');
var pickFiles   = require('./custom-static-compiler');
var jshintTrees = require('broccoli-jshint');
var concatFiles = require('broccoli-concat');
var remove      = require('broccoli-file-remover');

var upstreamMergeTrees  = require('broccoli-merge-trees');

var unwatchedTree    = require('broccoli-unwatched-tree');
var uglifyJavaScript = require('broccoli-uglify-js');

var assign        = require('lodash-node/modern/objects/assign');
var defaults      = require('lodash-node/modern/objects/defaults');
var merge         = require('lodash-node/modern/objects/merge');
var path          = require('path');
var ES3SafeFilter = require('broccoli-es3-safe-recast');

function mergeTrees(inputTree, options) {
  var tree = upstreamMergeTrees(inputTree, options);

  tree.description = options && options.description;

  return tree;
}

module.exports = EmberApp;

function EmberApp(options) {
  options = options || {};

  this.project = options.project || Project.closestSync(process.cwd());

  this.env  = process.env.EMBER_ENV || 'development';
  this.name = options.name || this.project.name();

  this.registry = options.registry || p.setupRegistry(this);

  var isProduction = this.env === 'production';

  this.tests   = options.hasOwnProperty('tests')   ? options.tests   : !isProduction;
  this.hinting = options.hasOwnProperty('hinting') ? options.hinting : !isProduction;

  this.bowerDirectory = 'bower_components';

  if (fs.existsSync(path.join(this.project.root, '.bowerrc'))) {
    this.bowerDirectory = JSON.parse(fs.readFileSync(path.join(this.project.root, '.bowerrc'))).directory;
  }

  if (process.env.EMBER_CLI_TEST_COMMAND) {
    this.tests = true;
  }

  this.options = merge(options, {
    es3Safe: true,
    wrapInEval: !isProduction,
    minifyCSS: {
      enabled: true,
      options: { relativeTo: 'app/styles' }
    },
    minifyJS: {
      enabled: true,
      options: {
        mangle: true,
        compress: true
      }
    },
    loader: this.bowerDirectory + '/loader/loader.js',
    trees: {},
    jshintrc: {},
    getEnvJSON: this.project.require(options.environment || './config/environment'),
    vendorFiles: {}
  }, defaults);

  this.vendorFiles = merge(options.vendorFiles, {
    'loader.js': this.bowerDirectory + '/loader/loader.js',
    'jquery.js': this.bowerDirectory + '/jquery/dist/jquery.js',
    'handlebars.js': {
      development: this.bowerDirectory + '/handlebars/handlebars.js',
      production:  this.bowerDirectory + '/handlebars/handlebars.runtime.js'
    },
    'ember.js': {
      development: this.bowerDirectory + '/ember/ember.js',
      production:  this.bowerDirectory + '/ember/ember.prod.js'
    },
    'app-shims.js': [
      this.bowerDirectory + '/ember-cli-shims/app-shims.js', {
        exports: {
          ember: ['default']
        }
      }
    ],
    'ember-resolver.js': [
      this.bowerDirectory + '/ember-resolver/dist/modules/ember-resolver.js', {
        exports: {
          'ember/resolver': ['default']
        }
      }
    ],
    'ember-load-initializers.js': [
      this.bowerDirectory + '/ember-load-initializers/ember-load-initializers.js', {
        exports: {
          'ember/load-initializers': ['default']
        }
      }
    ]
  }, defaults);

  this.options.trees = merge(this.options.trees, {
    app:       'app',
    tests:     'tests',

    // these are contained within app/ no need to watch again
    styles:    unwatchedTree('app/styles'),
    templates: unwatchedTree('app/templates'),

    // do not watch vendor/ or bower's default directory by default
    vendor: this.unwatchedVendorTrees(),
  }, defaults);

  this.options.jshintrc = merge(this.options.jshintrc, {
    app: this.project.root,
    tests: path.join(this.project.root,  'tests'),
  }, defaults);

  this.importWhitelist         = {};
  this.legacyFilesToAppend     = [];
  this.vendorStaticStyles      = [];
  this.otherAssetPaths         = [];
  this._importTrees            = [];
  this.legacyTestFilesToAppend = [];
  this.vendorTestStaticStyles  = [];

  this.trees = this.options.trees;

  this.populateLegacyFiles();
  this._notifyAddonIncluded();
}

EmberApp.prototype.unwatchedVendorTrees = function() {
  var _this = this;
  var trees = ['vendor', this.bowerDirectory + ''].reduce(function(trees, treePath) {
    if (fs.existsSync(path.join(_this.project.root, treePath))) {
      trees.push(unwatchedTree(treePath));
    }

    return trees;
  }, []);

  return mergeTrees(trees);
};

EmberApp.prototype._notifyAddonIncluded = function() {
  this.initializeAddons();
  this.project.addons.forEach(function(addon) {
    if (addon.included) {
      addon.included(this);
    }
  }, this);
};

EmberApp.prototype.initializeAddons = function() {
  this.project.initializeAddons();
};

EmberApp.prototype.addonTreesFor = function(type) {
  return this.project.addons.map(function(addon) {
    if (addon.treeFor) {
      return addon.treeFor(type);
    }
  }, this).filter(Boolean);
};

EmberApp.prototype.addonPostprocessTree = function(type, tree) {
  var workingTree = tree;

  this.project.addons.forEach(function(addon) {
    if (addon.postprocessTree) {
      workingTree = addon.postprocessTree(type, workingTree);
    }
  });

  return workingTree;
};

EmberApp.prototype.populateLegacyFiles = function () {
  var name;
  for (name in this.vendorFiles) {
    var args = this.vendorFiles[name];

    if (args === null) { continue; }

    this.import.apply(this, [].concat(args));
  }
};

EmberApp.prototype.index = function() {
  var files = [
    'index.html'
  ];

  var index = pickFiles(this.trees.app, {
    srcDir: '/',
    files: files,
    destDir: '/'
  });

  return injectENVJson(this.options.getEnvJSON, this.env, index, files);
};

EmberApp.prototype.testIndex = function() {
  var index = pickFiles(this.trees.tests, {
    srcDir: '/',
    files: ['index.html'],
    destDir: '/tests'
  });

  return injectENVJson(this.options.getEnvJSON, this.env, index, [
    'tests/index.html'
  ]);
};

EmberApp.prototype.publicFolder = function() {
  return 'public';
};

EmberApp.prototype.removeStylesAndTemplates = function(tree) {
  return remove(tree, {
    paths: ['styles', 'templates']
  });
};

EmberApp.prototype._appWithoutStylesAndTemplates = function() {
  if (this._appWithoutStylesAndTemplatesTree) {
    return this._appWithoutStylesAndTemplatesTree;
  }

  return this._appWithoutStylesAndTemplatesTree = this.removeStylesAndTemplates(this.trees.app);
};

EmberApp.prototype._processedAppTree = function() {
  var addonTrees = this.addonTreesFor('app');
  var mergedApp  = mergeTrees(addonTrees.concat(this._appWithoutStylesAndTemplates()), {
    overwrite: true,
    description: 'TreeMerger (app)'
  });

  var mergedAppWithoutStylesAndTemplates = this.removeStylesAndTemplates(mergedApp);

  return pickFiles(mergedAppWithoutStylesAndTemplates, {
    srcDir: '/',
    destDir: this.name
  });
};

EmberApp.prototype._processedTemplatesTree = function() {
  var addonTrees      = this.addonTreesFor('templates');
  var mergedTemplates = mergeTrees(addonTrees.concat(this.trees.templates), {
    overwrite: true,
    description: 'TreeMerger (templates)'
  });

  var standardTemplates = pickFiles(mergedTemplates, {
    srcDir: '/',
    destDir: this.name + '/templates'
  });

  var podTemplates = pickFiles(this.trees.app, {
    srcDir: '/',
    files: ['**/template.*'],
    destDir: this.name + '/',
    allowEmpty: true
  });

  return preprocessTemplates(mergeTrees([standardTemplates, podTemplates]), {
    registry: this.registry
  });
};

EmberApp.prototype._processedTestsTree = function() {
  var addonTrees  = this.addonTreesFor('test-support');
  var mergedTests = mergeTrees(addonTrees.concat(this.trees.tests), {
    overwrite: true,
    description: 'TreeMerger (tests)'
  });

  return pickFiles(mergedTests, {
    srcDir: '/',
    destDir: this.name + '/tests'
  });
};

EmberApp.prototype._processedVendorTree = function() {
  if(this._cachedVendorTree) {
    return this._cachedVendorTree;
  }

  var addonTrees   = mergeTrees(this.addonTreesFor('addon'));
  addonTrees = mergeTrees([
    concatFiles(addonTrees, { inputFiles: ['*.css'], outputFile: '/addons.css', allowNone: true }),
    concatFiles(addonTrees, { inputFiles: ['*.js'],  outputFile: '/addons.js',  allowNone: true })
  ].concat(this.addonTreesFor('vendor')), {
    overwrite: true
  });

  var mergedVendor = mergeTrees(this._importTrees.concat(addonTrees, this.trees.vendor), {
    overwrite: true,
    description: 'TreeMerger (vendor)'
  });

  this._cachedVendorTree = pickFiles(mergedVendor, {
    srcDir: '/',
    destDir: 'vendor/'
  });
  return this._cachedVendorTree;
};

EmberApp.prototype.appAndDependencies = function() {
  var app       = this._processedAppTree();
  var templates = this._processedTemplatesTree();

  if (this.options.es3Safe) {
    app = new ES3SafeFilter(app);
  }

  var vendor          = this._processedVendorTree();
  var preprocessedApp = preprocessJs(app, '/', this.name, {
    registry: this.registry
  });

  var sourceTrees = [ vendor, preprocessedApp, templates ];

  if (this.tests) {
    var tests  = this._processedTestsTree();
    var preprocessedTests = preprocessJs(tests, '/tests', this.name, {
      registry: this.registry
    });

    sourceTrees.push(preprocessedTests);

    if (this.hinting) {
      var jshintedApp = jshintTrees(this._appWithoutStylesAndTemplates(), {
        jshintrcPath: this.options.jshintrc.app,
        description: 'JSHint - App'
      });

      var jshintedTests = jshintTrees(tests, {
        jshintrcPath: this.options.jshintrc.tests,
        description: 'JSHint - Tests'
      });

      jshintedApp = pickFiles(jshintedApp, {
        srcDir: '/',
        destDir: this.name + '/tests/'
      });

      jshintedTests = pickFiles(jshintedTests, {
        srcDir: '/',
        destDir: this.name + '/tests/'
      });

      sourceTrees.push(jshintedApp);
      sourceTrees.push(jshintedTests);
    }
  }

  var emberCLITree = pickFiles(unwatchedTree(__dirname), {
    files: ['loader.js'],
    srcDir: '/',
    destDir: '/assets/ember-cli/'
  });

  sourceTrees.push(emberCLITree);

  return mergeTrees(sourceTrees, {
    overwrite: true,
    description: 'TreeMerger (appAndDependencies)'
  });
};

EmberApp.prototype.javascript = function() {
  var applicationJs       = this.appAndDependencies();
  var legacyFilesToAppend = this.legacyFilesToAppend;

  var es6 = compileES6(applicationJs, {
    loaderFile: 'assets/ember-cli/loader.js',
    ignoredModules: Object.keys(this.importWhitelist),
    inputFiles: [
      this.name + '/**/*.js'
    ],
    wrapInEval: this.options.wrapInEval,
    outputFile: '/assets/' + this.name + '.js',
  });

  var vendor = concatFiles(applicationJs, {
    inputFiles: legacyFilesToAppend.concat(['vendor/addons.js']),
    outputFile: '/assets/vendor.js',
    separator: '\n;'
  });

  var vendorAndApp = mergeTrees([vendor, es6]);

  if (this.env === 'production' && this.options.minifyJS.enabled === true) {
    var options = this.options.minifyJS.options || {};
    return uglifyJavaScript(vendorAndApp, options);
  } else {
    return vendorAndApp;
  }
};

EmberApp.prototype.styles = function() {
  var addonTrees = this.addonTreesFor('styles');
  var vendor = this._processedVendorTree();
  var styles = pickFiles(this.trees.styles, {
    srcDir: '/',
    destDir: '/app/styles'
  });

  var trees = [vendor].concat(addonTrees);
  trees.push(styles);

  var stylesAndVendor = mergeTrees(trees, {
    description: 'TreeMerger (stylesAndVendor)'
  });

  var processedStyles = preprocessCss(stylesAndVendor, '/app/styles', '/assets', {
    registry: this.registry
  });
  var vendorStyles    = concatFiles(stylesAndVendor, {
    inputFiles: this.vendorStaticStyles.concat(['vendor/addons.css']),
    outputFile: '/assets/vendor.css',
    description: 'concatFiles - vendorStyles'
  });

  if (this.env === 'production' && this.options.minifyCSS.enabled === true) {
    var options = this.options.minifyCSS.options || {};
    options.registry = this.registry;
    processedStyles = preprocessMinifyCss(processedStyles, options);
    vendorStyles    = preprocessMinifyCss(vendorStyles, options);
  }

  return mergeTrees([
      processedStyles,
      vendorStyles
    ], {
      description: 'styles'
    });
};

EmberApp.prototype.testFiles = function() {
  var vendor = this._processedVendorTree();

  var testJs = concatFiles(vendor, {
    inputFiles: this.legacyTestFilesToAppend,
    outputFile: '/assets/test-support.js'
  });

  var testCss = concatFiles(vendor, {
    inputFiles: this.vendorTestStaticStyles,
    outputFile: '/assets/test-support.css'
  });

  var testemPath = path.join(__dirname, 'testem');
  testemPath = path.dirname(testemPath);

  var testemTree = pickFiles(unwatchedTree(testemPath), {
      files: ['testem.js'],
      srcDir: '/',
      destDir: '/'
    });

  if (this.options.fingerprint && this.options.fingerprint.exclude) {
    this.options.fingerprint.exclude.push('testem');
  }

  var testLoader = pickFiles(this.trees.vendor, {
    files: ['test-loader.js'],
    srcDir: '/ember-cli-test-loader',
    destDir: '/assets/'
  });

  var sourceTrees = [
    testJs,
    testCss,
    testLoader,
    testemTree
  ];

  return mergeTrees(sourceTrees, {
      overwrite: true,
      description: 'TreeMerger (testFiles)'
    });
};

EmberApp.prototype.otherAssets = function() {
  var vendor = this._processedVendorTree();
  var otherAssetTrees = this.otherAssetPaths.map(function (path) {
    return pickFiles(vendor, {
      srcDir: path.src,
      files: [path.file],
      destDir: path.dest
    });
  });
  return mergeTrees(otherAssetTrees, {
    description: 'TreeMerger (otherAssetTrees)'
  });
};

EmberApp.prototype.import = function(asset, options) {
  var assetPath;

  if (typeof asset === 'object') {
    assetPath = asset[this.env] || asset.development;
  } else {
    assetPath = asset;
  }

  if (!assetPath) {
    return;
  }

  assetPath = assetPath.replace(new RegExp('^'+this.bowerDirectory), 'vendor');

  if (assetPath.split('/').length < 2) {
    console.log(chalk.red('Using `app.import` with a file in the root of `vendor/` causes a significant performance penalty. Please move `'+ assetPath + '` into a subdirectory.'));
  }

  options = defaults(options || {}, {
    type: 'vendor'
  });

  if (/[\*\,]/.test(assetPath)) {
    throw new Error('You must pass a file path (without glob pattern) to `app.import`.  path was: `' + assetPath + '`');
  }

  var directory    = path.dirname(assetPath);
  var subdirectory = directory.replace(/^vendor\//, '');
  var extension    = path.extname(assetPath);
  var basename     = path.basename(assetPath);

  if (!extension) {
    throw new Error('You must pass a file to `app.import`. For directories specify them to the constructor under the `trees` option.');
  }

  if (fs.existsSync(directory) && this._importTrees.indexOf(directory) === -1) {
    var assetTree = pickFiles(directory, {
      srcDir: '/',
      destDir: subdirectory
    });

    this._importTrees.push(assetTree);
  }

  if (isType(assetPath, 'js', {registry: this.registry})) {
    if(options.type === 'vendor') {
      this.legacyFilesToAppend.push(assetPath);
    } else {
      this.legacyTestFilesToAppend.push(assetPath);
    }

    this.importWhitelist = assign(this.importWhitelist, options.exports || {});
  } else if (extension === '.css') {
    if(options.type === 'vendor') {
      this.vendorStaticStyles.push(assetPath);
    } else {
      this.vendorTestStaticStyles.push(assetPath);
    }
  } else {
    var destDir = options.destDir;
    if (destDir === '') {
      destDir = '/';
    }
    this.otherAssetPaths.push({
      src: directory,
      file: basename,
      dest: destDir || subdirectory
    });
  }
};

EmberApp.prototype.toArray = function() {
  var sourceTrees = [
    this.index(),
    this.javascript(),
    this.styles(),
    this.otherAssets()
  ];

  var publicFolder = this.publicFolder();
  if (fs.existsSync(publicFolder)) {
    sourceTrees.push(publicFolder);
  }

  if (this.tests) {
    sourceTrees = sourceTrees.concat(this.testIndex(), this.testFiles());
  }

  return sourceTrees;
};

EmberApp.prototype.toTree = function(additionalTrees) {
  var tree = mergeTrees(this.toArray().concat(additionalTrees || []), {
    overwrite: true,
    description: 'TreeMerger (allTrees)'
  });

  return this.addonPostprocessTree('all', tree);
};

function injectENVJson(fn, env, tree, files) {
  // TODO: real templating
  var envJsonString = function(){
    return JSON.stringify(fn(env));
  };

  var baseTag = function(){
    var envJSON      = fn(env);
    var baseURL      = cleanBaseURL(envJSON.baseURL);
    var locationType = envJSON.locationType;

    if (locationType === 'hash' || locationType === 'none') {
      return '';
    }

    if (baseURL) {
      return '<base href="' + baseURL + '">';
    } else {
      return '';
    }
  };

  return replace(tree, {
    files: files,
    patterns: [{
      match: /\{\{ENV\}\}/g,
      replacement: envJsonString
    },
    {
      match: /\{\{BASE_TAG\}\}/g,
      replacement: baseTag
    }]
  });
}
