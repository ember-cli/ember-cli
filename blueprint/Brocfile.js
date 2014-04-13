/* global require, module */

var uglifyJavaScript = require('broccoli-uglify-js');
var replace = require('broccoli-replace');
var compileES6 = require('broccoli-es6-concatenator');
var validateES6 = require('broccoli-es6-import-validate');
var pickFiles = require('broccoli-static-compiler');
var mergeTrees = require('broccoli-merge-trees');
var findBowerTrees = require('broccoli-bower');

var env = require('broccoli-env').getEnv();
var getEnvJSON = require('./config/environment');

var p = require('ember-cli/lib/preprocessors');
var preprocessCss = p.preprocessCss;
var preprocessTemplates = p.preprocessTemplates;
var preprocessJs = p.preprocessJs;

module.exports = function (broccoli) {

  var prefix = '<%= modulePrefix %>';
  var rootURL = '/';

  // index.html

  var indexHTML = pickFiles('app', {
    srcDir: '/',
    files: ['index.html'],
    destDir: '/'
  });

  indexHTML = replace(indexHTML, {
    files: ['index.html'],
    patterns: [{ match: /\{\{ENV\}\}/g, replacement: getEnvJSON.bind(null, env)}]
  });

  // sourceTrees, appAndDependencies for CSS and JavaScript

  var app = pickFiles('app', {
    srcDir: '/',
    destDir: prefix
  });

  app = preprocessTemplates(app);

  var config = pickFiles('config', { // Don't pick anything, just watch config folder
    srcDir: '/',
    files: [],
    destDir: '/'
  });

  var sourceTrees = [app, config, 'vendor'].concat(findBowerTrees());
  var appAndDependencies = mergeTrees(sourceTrees, { overwrite: true });

  // JavaScript

  var legacyFilesToAppend = [
    'jquery.js',
    'handlebars.js',
    'ember.js',
    'ic-ajax/dist/named-amd/main.js',
    'ember-data.js',
    'app-shims.js',
    'ember-resolver.js',
    'ember-load-initializers.js'
  ];

  var applicationJs = preprocessJs(appAndDependencies, '/', prefix);

  applicationJs = compileES6(applicationJs, {
    loaderFile: 'loader/loader.js',
    ignoredModules: [
      'ember',
      'ember/resolver',
      'ember/load-initializers',
      'ic-ajax'
    ],
    inputFiles: [
      prefix + '/**/*.js'
    ],
    legacyFilesToAppend: legacyFilesToAppend,
    wrapInEval: env !== 'production',
    outputFile: '/assets/app.js'
  });

  if (env === 'production') {
    applicationJs = uglifyJavaScript(applicationJs, {
      mangle: false,
      compress: false
    });
  }

  // Styles

  var styles = preprocessCss(appAndDependencies, prefix + '/styles', '/assets');

  // Ouput

  var outputTrees = [
    indexHTML,
    applicationJs,
    'public',
    styles
  ];

  // Testing

  if (env !== 'production') {

    var tests = pickFiles('tests', {
      srcDir: '/',
      destDir: prefix + '/tests'
    });

    var testsIndexHTML = pickFiles('tests', {
      srcDir: '/',
      files: ['index.html'],
      destDir: '/tests'
    });

    var qunitStyles = pickFiles('vendor', {
      srcDir: '/qunit/qunit',
      files: ['qunit.css'],
      destDir: '/assets/'
    });

    testsIndexHTML = replace(testsIndexHTML, {
      files: ['tests/index.html'],
      patterns: [{ match: /\{\{ENV\}\}/g, replacement: getEnvJSON.bind(null, env)}]
    });

    tests = preprocessTemplates(tests);

    sourceTrees = [tests, 'vendor'].concat(findBowerTrees());
    appAndDependencies = mergeTrees(sourceTrees, { overwrite: true });

    var testsJs = preprocessJs(appAndDependencies, '/', prefix);

    var validatedJs = validateES6(mergeTrees([app, tests]), {
      whitelist: {
        'ember': ['default'],
        'ember/resolver': ['default'],
        'ember/load-initializers': ['default'],
        'ember-qunit': [
          'globalize',
          'moduleFor',
          'moduleForComponent',
          'moduleForModel',
          'test',
          'setResolver'
        ],
        'qunit': ['default']
      }
    });

    var legacyTestFilesToAppend = [
      'qunit/qunit/qunit.js',
      'test-shims.js',
      'ember-qunit/dist/named-amd/main.js'
    ];

    testsJs = compileES6(testsJs, {
      // Temporary workaround for
      // https://github.com/joliss/broccoli-es6-concatenator/issues/9
      loaderFile: '_loader.js',
      ignoredModules: [
        'ember/resolver',
        'ember/load-initializers',
        'qunit',
        'ember-qunit'
      ],
      inputFiles: [
        prefix + '/**/*.js'
      ],
      legacyFilesToAppend: legacyTestFilesToAppend,

      wrapInEval: true,
      outputFile: '/assets/tests.js'
    });

    var testsTrees = [qunitStyles, testsIndexHTML, validatedJs, testsJs];
    outputTrees = outputTrees.concat(testsTrees);
  }

  return mergeTrees(outputTrees, { overwrite: true });
};
