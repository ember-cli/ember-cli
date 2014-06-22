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

var replace     = require('broccoli-replace');
var compileES6  = require('broccoli-es6-concatenator');
//var validateES6 = require('broccoli-es6-import-validate');
var pickFiles   = require('broccoli-static-compiler');
var jshintTrees = require('broccoli-jshint');
var concatFiles = require('broccoli-concat');
var moveFile    = require('broccoli-file-mover');
var assetRev    = require('broccoli-asset-rev');

var upstreamMergeTrees  = require('broccoli-merge-trees');

var unwatchedTree    = require('broccoli-unwatched-tree');
var uglifyJavaScript = require('broccoli-uglify-js');

var memoize    = require('lodash-node/modern/functions').memoize;
var assign     = require('lodash-node/modern/objects/assign');
var defaults   = require('lodash-node/modern/objects/defaults');
var path       = require('path');
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

  this.options = defaults(options, {
    es3Safe: true,
    wrapInEval: !isProduction,
    minifyCSS: {
      enabled: true,
      options: {}
    },
    minifyJS: {
      enabled: true,
      options: {
        mangle: true,
        compress: true
      }
    },
    fingerprint: {
      enabled: isProduction,
      exclude: [],
      extensions: ['js', 'css', 'png', 'jpg', 'gif'],
      prepend: '',
      replaceExtensions: ['html', 'css', 'js']
    },
    loader: 'vendor/loader/loader.js',
    trees: {},
    getEnvJSON: this.project.require('./config/environment')
  });

  this.options.trees = defaults(this.options.trees, {
    app:    'app',
    styles: 'app/styles',
    tests:  'tests',
    vendor: unwatchedTree('vendor'),
  });

  this.importWhitelist     = {};
  this.legacyFilesToAppend = [];
  this.vendorStaticStyles  = [];
  this.otherAssetTrees     = [];
  this._importTrees        = [];

  this.trees = this.options.trees;

  this.populateLegacyFiles();
  this._notifyAddonIncluded();
}

EmberApp.prototype._notifyAddonIncluded = function() {
  this.project.initializeAddons();
  this.project.addons.forEach(function(addon) {
    if (typeof addon.included !== 'function') {
      throw new Error('The `' + addon.constructor.name + '` addon must implement the `included` hook.');
    }
    addon.included(this);
  }, this);
};

EmberApp.prototype.addonTreesFor = function(type) {
  var addonTrees = this.project.addons.map(function(addon) {
    if (typeof addon.treeFor !== 'function') {
      throw new Error('The `' + addon.constructor.name + '` addon must implement the `treeFor` hook.');
    }

    return addon.treeFor(type);
  }, this);

  return addonTrees.filter(function(tree) {
    return !!tree;
  });
};

EmberApp.prototype.populateLegacyFiles = function () {
  this.import('vendor/loader/loader.js');

  this.import('vendor/jquery/dist/jquery.js');

  this.import({
    development: 'vendor/handlebars/handlebars.js',
    production:  'vendor/handlebars/handlebars.runtime.js'
  });

  this.import({
    development: 'vendor/ember/ember.js',
    production:  'vendor/ember/ember.prod.js'
  });

  this.import('vendor/ember-cli-shims/app-shims.js', {
    exports: {
      ember: ['default']
    }
  });

  this.import('vendor/ember-resolver/dist/modules/ember-resolver.js', {
    exports: {
      'ember/resolver': ['default']
    }
  });

  this.import('vendor/ember-load-initializers/ember-load-initializers.js', {
    exports: {
      'ember/load-initializers': ['default']
    }
  });
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

  return pickFiles(mergedApp, {
    srcDir: '/',
    destDir: this.name
  });
});

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
  var app    = this._processedAppTree();
  if (this.options.es3Safe) {
    app = new ES3SafeFilter(app);
  }

  var vendor = this._processedVendorTree();

  var appAndTemplates = preprocessTemplates(app);

  var sourceTrees = [ vendor ];

  if (this.tests) {
    var tests  = this._processedTestsTree();
    var preprocessedTests = preprocessJs(tests, '/tests', this.name);

    sourceTrees.push(preprocessedTests);

    if (this.hinting) {
      var jshintedApp = jshintTrees(app, {
        jshintrcPath: this.project.root,
        description: 'JSHint - App'
      });
      var jshintedTests = jshintTrees(tests, {
        jshintrcPath: path.join(this.project.root,  'tests'),
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

  // js hint should be applied before preprocessing, validateES6 after
  var preprocessedApp = preprocessJs(appAndTemplates, '/', this.name);
  sourceTrees.unshift(preprocessedApp);

  if (this.hinting) {
    //var applicationJs = validateES6(preprocessedApp, {
    //  whitelist: this.importWhitelist
    //});
    sourceTrees.push(preprocessedApp);
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

  if (this.env !== 'production') {
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

  var trees = [vendor];
  trees.concat(addonTrees);
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
  var qunitFiles = pickFiles(this.trees.vendor, {
      srcDir: '/qunit/qunit',
      files: [
        'qunit.css', 'qunit.js'
      ],
      destDir: '/assets/'
    });

  var notificationsFile = moveFile(this.trees.vendor, {
    srcFile: '/qunit-notifications/index.js',
    destFile: '/assets/qunit-notifications.js',
    duplicate: false,
    description: 'moveFile - notificationsFile'
  });

  qunitFiles = mergeTrees([
    qunitFiles,
    notificationsFile
  ], {
    overwrite: true,
    description: 'TreeMerger (qunitFiles)'
  });

  var testemPath = path.join(__dirname, 'testem');
  testemPath = path.dirname(testemPath);

  var testemTree = pickFiles(unwatchedTree(testemPath), {
      files: ['testem.js'],
      srcDir: '/',
      destDir: '/'
    });

  var iconsPath = 'vendor/ember-qunit-notifications';

  var iconsTree = pickFiles(iconsPath, {
    files: ['passed.png', 'failed.png'],
    srcDir: '/',
    destDir: '/assets/'
  });

  var testLoader = pickFiles('vendor/ember-cli-test-loader', {
    files: ['test-loader.js'],
    srcDir: '/',
    destDir: '/assets/'
  });

  var sourceTrees = [
    qunitFiles,
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
  return mergeTrees(this.otherAssetTrees, {
    description: 'TreeMerger (otherAssetTrees)'
  });
});

EmberApp.prototype.import = function(asset, options) {
  var assetPath;

  if (typeof asset === 'object') {
    assetPath = asset[this.env];
  } else {
    assetPath = asset;
  }

  if (assetPath === null) {
    return;
  }

  if (typeof options === 'object' && typeof options.exports  === 'undefined') {
    console.log(chalk.red('app.import('+ assetPath +') - Passing modules object is deprecated. Please pass an option object with modules as export key (see http://git.io/H1GsPw for more info).'));

    options = {
      exports: options
    };
  }

  options = options || {};

  if (/[\*\,]/.test(assetPath)) {
    throw new Error('You must pass a file path (without glob pattern) to `app.import`.  path was: `' + assetPath + '`');
  }

  var directory = path.dirname(assetPath);
  var subdirectory = directory.replace(/^vendor\//, '');
  var extension = path.extname(assetPath);
  var basename  = path.basename(assetPath);

  if (!extension) {
    throw new Error('You must pass a file to `app.import`. For directories specify them to the constructor under the `trees` option.');
  }

  if (fs.existsSync(directory)) {
    var assetTree = pickFiles(directory, {
      srcDir: '/',
      destDir: subdirectory
    });

    this._importTrees.push(assetTree);
  }

  if (isType(assetPath, 'js')) {
    this.legacyFilesToAppend.push(assetPath);

    this.importWhitelist = assign(this.importWhitelist, options.exports || {});
  } else if (extension === '.css') {
    this.vendorStaticStyles.push(assetPath);
  } else {
    var otherAssetTree = pickFiles(this.trees.vendor, {
      srcDir: subdirectory,
      files: [basename],
      destDir: subdirectory
    });

    this.otherAssetTrees.push(otherAssetTree);
  }
};

EmberApp.prototype.fingerprint = function(tree) {
  return assetRev(tree, {
    fingerprintExtensions: this.options.fingerprint.extensions,
    fingerprintExclude:    this.options.fingerprint.exclude,
    replaceExtensions:     this.options.fingerprint.replaceExtensions,
    prependPath:           this.options.fingerprint.prepend,
    customHash:            this.options.fingerprint.customHash
  });
};

EmberApp.prototype.toArray = function() {
  var sourceTrees = [
    this.index(),
    this.javascript(),
    this.publicFolder(),
    this.styles(),
    this.otherAssets()
  ];

  if (this.tests) {
    sourceTrees = sourceTrees.concat(this.testIndex(), this.testFiles());
  }

  return sourceTrees;
};

EmberApp.prototype.toTree = memoize(function() {
  var tree = mergeTrees(this.toArray(), {
    overwrite: true,
    description: 'TreeMerger (allTrees)'
  });

  if (this.options.fingerprint.enabled === true) {
    tree = this.fingerprint(tree);
  }

  return tree;
});

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
