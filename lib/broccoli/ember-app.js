/* global require, module */
'use strict';

var p = require('../preprocessors');

var preprocessJs        = p.preprocessJs;
var preprocessCss       = p.preprocessCss;
var preprocessTemplates = p.preprocessTemplates;

var replace     = require('broccoli-replace');
var compileES6  = require('broccoli-es6-concatenator');
var validateES6 = require('broccoli-es6-import-validate');
var pickFiles   = require('broccoli-static-compiler');
var mergeTrees  = require('broccoli-merge-trees');
var jshintTrees = require('broccoli-jshint');

var findBowerTrees   = require('broccoli-bower');
var uglifyJavaScript = require('broccoli-uglify-js');

var memoize = require('lodash-node/modern/functions').memoize;

module.exports = EmberApp;

function EmberApp(options) {
  this.env  = process.env.EMBER_ENV;
  this.name = options.name;

  this.options = options;

  this.ignoredModules      = options.ignoredModules;
  this.legacyFilesToAppend = options.legacyFilesToAppend;

  this.trees = this.options.trees || {};

  this.wrapInEval = this.options.wrapInEval || this.notInProduction();

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

  if (this.notInProduction()) {
    var tests = pickFiles(this.trees.tests, {
      srcDir: '/',
      destDir: this.name + '/tests'
    });

    sourceTrees.push(tests);

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

  return mergeTrees(sourceTrees, {
      overwrite: true
    });
});

EmberApp.prototype.prepareJavascriptsForCompilation = function() {
  if (this.notInProduction()) {
    this.ignoredModules.push(
      'qunit',
      'ember-qunit'
    );

    this.legacyFilesToAppend.push(
      'test-shims.js',
      'ember-qunit/dist/named-amd/main.js'
    );
  }
  return preprocessJs(this.appAndDependencies(), '/', this.name);
};

EmberApp.prototype.javascript = memoize(function() {
  var applicationJs = this.prepareFilesForCompilation();

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

  if (this.inProduction()) {
    return uglifyJavaScript(es6);
  } else {
    return es6;
  }
});

EmberApp.prototype.styles = memoize(function() {
  return preprocessCss(this.appAndDependencies(), this.name + '/styles', '/assets');
});

EmberApp.prototype.inProduction = memoize(function() {
  return this.env === 'production';
});

EmberApp.prototype.notInProduction = function() {
  return !this.inProduction();
};

EmberApp.prototype.testFiles = memoize(function() {
  var qunitFiles = pickFiles('vendor', {
      srcDir: '/qunit/qunit',
      files: [
        'qunit.css', 'qunit.js'
      ],
      destDir: '/assets/'
    });

  var testemTree = pickFiles('lib/broccoli', {
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

  if (this.notInProduction()) {
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
  var fnEnv = fn(env);

  return replace(tree, {
    files: files,
    patterns: [{
      match: /\{\{ENV\}\}/g,
      replacement: JSON.stringify(fnEnv)
    },
    {
      match: /\{\{BASE_URL\}\}/g,
      replacement: fnEnv.baseURL || ''
    }]
  });
}
