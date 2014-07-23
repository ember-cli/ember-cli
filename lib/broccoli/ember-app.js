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

var memoize       = require('lodash-node/modern/functions').memoize;
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
    loader: 'vendor/loader/loader.js',
    trees: {},
    jshintrc: {},
    getEnvJSON: this.project.require(options.environment || './config/environment'),
    vendorFiles: {}
  }, defaults);

  this.vendorFiles = merge(options.vendorFiles, {
    'loader.js': 'vendor/loader/loader.js',
    'jquery.js': 'vendor/jquery/dist/jquery.js',
    'handlebars.js': {
      development: 'vendor/handlebars/handlebars.js',
      production:  'vendor/handlebars/handlebars.runtime.js'
    },
    'ember.js': {
      development: 'vendor/ember/ember.js',
      production:  'vendor/ember/ember.prod.js'
    },
    'app-shims.js': [
      'vendor/ember-cli-shims/app-shims.js', {
        exports: {
          ember: ['default']
        }
      }
    ],
    'ember-resolver.js': [
      'vendor/ember-resolver/dist/modules/ember-resolver.js', {
        exports: {
          'ember/resolver': ['default']
        }
      }
    ],
    'ember-load-initializers.js': [
      'vendor/ember-load-initializers/ember-load-initializers.js', {
        exports: {
          'ember/load-initializers': ['default']
        }
      }
    ],
    'qunit.js' : [
      'vendor/qunit/qunit/qunit.js', {
        type: 'test '
      }
    ],
    'qunit.css': [
      'vendor/qunit/qunit/qunit.css', {
        type: 'test'
      }
    ],
    'qunit-notifications.js': [
      'vendor/qunit-notifications/index.js', {
        type: 'test'
      }
    ]
  }, defaults);

  this.options.trees = merge(this.options.trees, {
    app:       'app',
    tests:     'tests',

    // these are contained within app/ no need to watch again
    styles:    unwatchedTree('app/styles'),
    templates: unwatchedTree('app/templates'),

    // do not watch vendor/ by default
    vendor: unwatchedTree('vendor'),
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

EmberApp.prototype._notifyAddonIncluded = function() {
  this.project.initializeAddons();
  this.project.addons.forEach(function(addon) {
    if (addon.included) {
      addon.included(this);
    }
  }, this);
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

EmberApp.prototype.index = memoize(function() {
  var files = [
    'index.html'
  ];

  var index = pickFiles(this.trees.app, {
    srcDir: '/',
    files: files,
    destDir: '/'
  });

  return injectENVJson(this.options.getEnvJSON, this.env, index, files);
});

EmberApp.prototype.testIndex = memoize(function() {
  var index = pickFiles(this.trees.tests, {
    srcDir: '/',
    files: ['index.html'],
    destDir: '/tests'
  });

  return injectENVJson(this.options.getEnvJSON, this.env, index, [
    'tests/index.html'
  ]);
});

EmberApp.prototype.publicFolder = function() {
  return 'public';
};

EmberApp.prototype._processedAppTree = memoize(function() {
  var addonTrees = this.addonTreesFor('app');
  var mergedApp  = mergeTrees(addonTrees.concat(this.trees.app), {
    overwrite: true,
    description: 'TreeMerger (app)'
  });

  var mergedAppWithoutStylesAndTemplates = remove(mergedApp, {
    paths: ['styles', 'templates']
  });

  return pickFiles(mergedAppWithoutStylesAndTemplates, {
    srcDir: '/',
    destDir: this.name
  });
});

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

  return preprocessTemplates(mergeTrees([standardTemplates, podTemplates]));
};

EmberApp.prototype._processedTestsTree = memoize(function() {
  return pickFiles(this.trees.tests, {
    srcDir: '/',
    destDir: this.name + '/tests'
  });
});

EmberApp.prototype._processedVendorTree = memoize(function() {
  var addonTrees   = this.addonTreesFor('vendor');
  var mergedVendor = mergeTrees(this._importTrees.concat(addonTrees, this.trees.vendor), {
    overwrite: true,
    description: 'TreeMerger (vendor)'
  });

  return pickFiles(mergedVendor, {
    srcDir: '/',
    destDir: 'vendor/'
  });
});

EmberApp.prototype.appAndDependencies = memoize(function() {
  var app       = this._processedAppTree();
  var templates = this._processedTemplatesTree();

  if (this.options.es3Safe) {
    app = new ES3SafeFilter(app);
  }

  var vendor          = this._processedVendorTree();
  var preprocessedApp = preprocessJs(app, '/', this.name);

  var sourceTrees = [ vendor, preprocessedApp, templates ];

  if (this.tests) {
    var tests  = this._processedTestsTree();
    var preprocessedTests = preprocessJs(tests, '/tests', this.name);

    sourceTrees.push(preprocessedTests);

    if (this.hinting) {
      var jshintedApp = jshintTrees(preprocessedApp, {
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
});

EmberApp.prototype.javascript = memoize(function() {
  var applicationJs       = this.appAndDependencies();
  var legacyFilesToAppend = this.legacyFilesToAppend;

  if (this.tests) {
    this.import('vendor/ember-qunit/dist/named-amd/main.js', {
      exports: {
        'ember-qunit': [
          'globalize',
          'moduleFor',
          'moduleForComponent',
          'moduleForModel',
          'test',
          'setResolver'
        ]
      }
    });

    this.import('vendor/ember-cli-shims/test-shims.js', {
      exports: {
        'qunit': ['default']
      }
    });
  }

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
    inputFiles: legacyFilesToAppend,
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
});

EmberApp.prototype.styles = memoize(function() {
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

  var processedStyles = preprocessCss(stylesAndVendor, '/app/styles', '/assets');
  var vendorStyles    = concatFiles(stylesAndVendor, {
    inputFiles: this.vendorStaticStyles,
    outputFile: '/assets/vendor.css',
    description: 'concatFiles - vendorStyles'
  });

  if (this.env === 'production' && this.options.minifyCSS.enabled === true) {
    var options = this.options.minifyCSS.options || {};
    processedStyles = preprocessMinifyCss(processedStyles, options);
    vendorStyles    = preprocessMinifyCss(vendorStyles, options);
  }

  return mergeTrees([
      processedStyles,
      vendorStyles
    ], {
      description: 'styles'
    });
});

EmberApp.prototype.testFiles = memoize(function() {
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

  var iconsTree = pickFiles(this.trees.vendor, {
    files: ['passed.png', 'failed.png'],
    srcDir: '/ember-qunit-notifications',
    destDir: '/assets/'
  });

  var testLoader = pickFiles(this.trees.vendor, {
    files: ['test-loader.js'],
    srcDir: '/ember-cli-test-loader',
    destDir: '/assets/'
  });

  var sourceTrees = [
    testJs,
    testCss,
    testemTree,
    iconsTree,
    testLoader
  ];

  return mergeTrees(sourceTrees, {
      overwrite: true,
      description: 'TreeMerger (testFiles)'
    });
});

EmberApp.prototype.otherAssets = memoize(function() {
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
});

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

  if (isType(assetPath, 'js')) {
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
      return '<base href="' + baseURL + '" />';
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
