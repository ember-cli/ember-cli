/* global require, module */
'use strict';

var p = require('../preprocessors');

var cleanBaseURL = require('../utilities/clean-base-url');

var preprocessJs  = p.preprocessJs;
var preprocessCss = p.preprocessCss;
var isType        = p.isType;

var preprocessTemplates = p.preprocessTemplates;

var preprocessMinifyCss = p.preprocessMinifyCss;

var replace     = require('broccoli-replace');
var compileES6  = require('broccoli-es6-concatenator');
var validateES6 = require('broccoli-es6-import-validate');
var pickFiles   = require('broccoli-static-compiler');
var mergeTrees  = require('broccoli-merge-trees');
var jshintTrees = require('broccoli-jshint');
var concatFiles = require('broccoli-concat');

var unwatchedTree    = require('broccoli-unwatched-tree');
var uglifyJavaScript = require('broccoli-uglify-js');

var memoize    = require('lodash-node/modern/functions').memoize;
var assign     = require('lodash-node/modern/objects/assign');
var defaults   = require('lodash-node/modern/objects/defaults');
var path       = require('path');

module.exports = EmberApp;

function EmberApp(options) {
  this.env  = process.env.EMBER_ENV || 'development';
  this.name = options.name;

  var isProduction = this.env === 'production';

  this.tests = this.hinting = !isProduction;

  this.options = defaults(options, {
    wrapInEval: !isProduction,
    minifyCSS: {
      enabled: true,
      options: {}
    },
    loader: 'vendor/loader/loader.js',
    trees: {},
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
}

EmberApp.prototype.populateLegacyFiles = function () {

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
    ember: ['default']
  });

  this.import('vendor/ember-resolver/dist/modules/ember-resolver.js', {
    'ember/resolver': ['default']
  });

  this.import('vendor/ember-load-initializers/ember-load-initializers.js', {
    'ember/load-initializers': ['default']
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
  return pickFiles(this.trees.app, {
    srcDir: '/',
    destDir: this.name
  });
});

EmberApp.prototype._processedVendorTree = memoize(function() {
  var mergedVendor = mergeTrees([this.trees.vendor].concat(this._importTrees), {
    overwrite: true
  });

  return pickFiles(mergedVendor, {
    srcDir: '/',
    destDir: 'vendor/'
  });
});

EmberApp.prototype.appAndDependencies = memoize(function() {
  var app    = this._processedAppTree();
  var vendor = this._processedVendorTree();

  var appAndTemplates = preprocessTemplates(app);

  var sourceTrees = [ appAndTemplates, vendor ];

  if (this.tests) {
    var tests = pickFiles(this.trees.tests, {
      srcDir: '/',
      destDir: this.name + '/tests'
    });

    sourceTrees.push(tests);

    if (this.hinting) {
      var importWhitelist = this.importWhitelist;

      var validatedJS = validateES6(mergeTrees([app, tests]), {
        whitelist: importWhitelist
      });
      sourceTrees.push(validatedJS);

      var jshintedApp = jshintTrees(app, {
        destFile: this.name + '/tests/app-jshint-test.js'
      });
      sourceTrees.push(jshintedApp);
      var jshintedTests = jshintTrees(tests, {
        jshintrcRoot: this.name + '/tests/',
        destFile: this.name + '/tests/tests-jshint-test.js'
      });
      sourceTrees.push(jshintedTests);
    }
  }

  return mergeTrees(sourceTrees, {
      overwrite: true
    });
});

EmberApp.prototype.javascript = memoize(function() {
  var applicationJs       = preprocessJs(this.appAndDependencies(), '/', this.name);
  var legacyFilesToAppend = this.legacyFilesToAppend;

  if (this.env !== 'production') {
    this.import('vendor/ember-qunit/dist/named-amd/main.js', {
      'ember-qunit': [
        'globalize',
        'moduleFor',
        'moduleForComponent',
        'moduleForModel',
        'test',
        'setResolver'
      ]
    });

    this.import('vendor/ember-cli-shims/test-shims.js', {
      'qunit': ['default']
    });
  }

  var es6 = compileES6(applicationJs, {
    loaderFile: this.options.loader,
    ignoredModules: Object.keys(this.importWhitelist),
    inputFiles: [
      this.name + '/**/*.js'
    ],
    wrapInEval: this.options.wrapInEval,
    outputFile: '/assets/' + this.name + '.js',
    legacyFilesToAppend: legacyFilesToAppend
  });

  if (this.env === 'production') {
    return uglifyJavaScript(es6, {
      mangle: true,
      compress: true
    });
  } else {
    return es6;
  }
});

EmberApp.prototype.styles = memoize(function() {
  var vendor = this._processedVendorTree();
  var styles = pickFiles(this.trees.styles, {
    srcDir: '/',
    destDir: '/app/styles'
  });

  var stylesAndVendor = mergeTrees([vendor, styles]);

  var processedStyles = preprocessCss(stylesAndVendor, '/app/styles', '/assets');
  var vendorStyles    = concatFiles(stylesAndVendor, {
    inputFiles: this.vendorStaticStyles,
    outputFile: '/assets/vendor.css'
  });

  if (this.env === 'production' && this.options.minifyCSS.enabled === true) {
    var options = this.options.minifyCSS.options || {};
    processedStyles = preprocessMinifyCss(processedStyles, options);
    vendorStyles    = preprocessMinifyCss(vendorStyles, options);
  }

  return mergeTrees([processedStyles, vendorStyles]);
});

EmberApp.prototype.testFiles = memoize(function() {
  var qunitFiles = pickFiles(this.trees.vendor, {
      srcDir: '/qunit/qunit',
      files: [
        'qunit.css', 'qunit.js'
      ],
      destDir: '/assets/'
    });

  var testemPath = path.join(__dirname, 'testem');
  testemPath = path.dirname(testemPath);

  var testemTree = pickFiles(testemPath, {
      files: ['testem.js'],
      srcDir: '/',
      destDir: '/'
    });

  var sourceTrees = [qunitFiles, testemTree];

  return mergeTrees(sourceTrees, {
      overwrite: true
    });
});

EmberApp.prototype.otherAssets = memoize(function() {
  return mergeTrees(this.otherAssetTrees);
});

EmberApp.prototype.import = function(asset, modules) {
  var assetPath;

  if (typeof asset === 'object') {
    assetPath = asset[this.env];
  } else {
    assetPath = asset;
  }

  var directory = path.dirname(assetPath);
  var extension = path.extname(assetPath);
  var basename  = path.basename(assetPath);

  if (!extension) {
    throw new Error('You must pass a file to `EmberApp::import`. For directories specify them to the constructor under the `trees` option.');
  }

  var assetTree = pickFiles(directory, {
    srcDir: '/',
    destDir: directory.replace(/^vendor\//, '')
  });

  this._importTrees.push(assetTree);

  if (isType(assetPath, 'js')) {
    this.legacyFilesToAppend.push(assetPath);

    this.importWhitelist = assign(this.importWhitelist, modules || {});
  } else if (extension === '.css') {
    this.vendorStaticStyles.push(assetPath);
  } else {
    var otherAssetTree = pickFiles(this.trees.vendor, {
      srcDir: directory,
      files: [basename],
      destDir: directory
    });

    this.otherAssetTrees.push(otherAssetTree);
  }
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
  return mergeTrees(this.toArray(), {
    overwrite: true
  });
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
