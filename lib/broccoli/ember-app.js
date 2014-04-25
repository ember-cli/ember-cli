/* global require, module */
'use strict';

var p = require('../preprocessors');

var preprocessJs  = p.preprocessJs;
var preprocessCss = p.preprocessCss;

var preprocessTemplates = p.preprocessTemplates;

var replace     = require('broccoli-replace');
var compileES6  = require('broccoli-es6-concatenator');
var validateES6 = require('broccoli-es6-import-validate');
var pickFiles   = require('broccoli-static-compiler');
var mergeTrees  = require('broccoli-merge-trees');

var findBowerTrees   = require('broccoli-bower');
var uglifyJavaScript = require('broccoli-uglify-js');

var memoize    = require('lodash-node/modern/functions').memoize;

module.exports = EmberApp;

function EmberApp(options) {
  this.env  = process.env.EMBER_ENV;
  this.name = options.name;

  this.options = options;

  this.ignoredModules      = options.ignoredModules;
  this.legacyFilesToAppend = options.legacyFilesToAppend;

  this.trees = this.options.trees || { };

  this.tests = this.hinting = (this.env !== 'production');
  this.wrapInEval = this.options.wrapInEval || this.tests;

  this.trees.app    = this.trees.app    || 'app';
  this.trees.styles = this.trees.styles || 'app/styles';
  this.trees.tests  = this.trees.tests  || 'tests';
  this.trees.vendor = this.trees.vendor || 'vendor';

  this.importWhitelist = options.importWhitelist || {};
}

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
  var index = pickFiles('tests', {
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

EmberApp.prototype.appAndDependencies = memoize(function() {
  var app = pickFiles(this.trees.app, {
    srcDir: '/',
    destDir: this.name
  });

  var appAndTemplates = preprocessTemplates(app);

  var sourceTrees = [
    appAndTemplates,
    'vendor'
  ].concat(findBowerTrees());

  if (this.tests) {
    var tests = pickFiles(this.trees.tests, {
      srcDir: '/',
      destDir: this.name + '/tests'
    });

    sourceTrees.push(tests);

    if (this.hinting) {
      var validatedJS = validateES6(mergeTrees([app, tests]), {
        whitelist: this.importWhitelist
      });

      sourceTrees.push(validatedJS);
    }
  }

  return mergeTrees(sourceTrees, {
      overwrite: true
    });
});

EmberApp.prototype.javascript = memoize(function() {
  var applicationJs = preprocessJs(this.appAndDependencies(), '/', this.name);

  var es6 = compileES6(applicationJs, {
    loaderFile: 'loader/loader.js',
    ignoredModules: this.ignoredModules,
    inputFiles: [
      this.name + '/**/*.js'
    ],
    wrapInEval: this.wrapInEval,
    outputFile: '/assets/app.js',
    legacyFilesToAppend: this.legacyFilesToAppend
  });

  if (this.env === 'production') {
    return uglifyJavaScript(es6);
  } else {
    return es6;
  }
});

EmberApp.prototype.styles = memoize(function() {
  return preprocessCss(this.appAndDependencies(), this.name + '/styles', '/assets');
});

EmberApp.prototype.testFiles = memoize(function() {
  return pickFiles('vendor', {
      srcDir: '/qunit/qunit',
      files: [
        'qunit.css', 'qunit.js'
      ],
      destDir: '/assets/'
    });
});

EmberApp.prototype.toArray = function() {
  var sourceTrees = [
    this.index(),
    this.javascript(),
    this.publicFolder(),
    this.styles()
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
  return replace(tree, {
    files: files,
    patterns: [{
      match: /\{\{ENV\}\}/g,
      replacement: fn.bind(null, env)
    }]
  });
}
