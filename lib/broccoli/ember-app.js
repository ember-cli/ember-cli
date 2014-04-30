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
var jshintTrees = require('broccoli-jshint');

var findBowerTrees   = require('broccoli-bower');
var uglifyJavaScript = require('broccoli-uglify-js');

var memoize    = require('lodash-node/modern/functions').memoize;
var path       = require('path');

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
      var importWhitelist = this.importWhitelist;

      importWhitelist.qunit = ['default'];
      importWhitelist['ember-qunit'] = [
        'globalize',
        'moduleFor',
        'moduleForComponent',
        'moduleForModel',
        'test',
        'setResolver'
      ];
      importWhitelist['ic-ajax'] = [
        'default',
        'defineFixture',
        'lookupFixture',
        'raw',
        'request',
      ];

      var validatedJS = validateES6(mergeTrees([app, tests]), {
        whitelist: importWhitelist
      });
      sourceTrees.push(validatedJS);

      var jshintedApp = jshintTrees(app, {
        destFile: this.name + '/tests/app-jshint-test.js'
      });
      sourceTrees.push(jshintedApp);
      var jshintedTests = jshintTrees(tests, {
        jshintrcRoot: 'tests/',
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
  var ignoredModules      = this.ignoredModules;

  if (this.env !== 'production') {
    ignoredModules.push(
      'qunit',
      'ember-qunit'
    );

    legacyFilesToAppend.push(
      'test-shims.js',
      'ember-qunit/dist/named-amd/main.js'
    );
  }

  var es6 = compileES6(applicationJs, {
    loaderFile: 'loader/loader.js',
    ignoredModules: ignoredModules,
    inputFiles: [
      this.name + '/**/*.js'
    ],
    wrapInEval: this.wrapInEval,
    outputFile: '/assets/app.js',
    legacyFilesToAppend: legacyFilesToAppend
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
  var qunitFiles = pickFiles('vendor', {
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
  var envJsonString = function(){
    return JSON.stringify(fn(env));
  };

  var baseTag = function(){
    var baseURL = fn(env).baseURL;

    if (baseURL && baseURL !== '') {
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
