/* global require, module */

var uglifyJavaScript = require('broccoli-uglify-js');
var replace = require('broccoli-replace');
var compileES6 = require('broccoli-es6-concatenator');
var pickFiles = require('broccoli-static-compiler');
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
    patterns: [{ match: /\{\{ENV\}\}/g, replacement: getEnvJSON.bind(env)}]
  });

  var testsIndexHTML = pickFiles('tests', {
    srcDir: '/',
    files: ['index.html'],
    destDir: '/tests'
  });

  testsIndexHTML = replace(testsIndexHTML, {
    files: ['tests/index.html'],
    patterns: [{ match: /\{\{ENV\}\}/g, replacement: getEnvJSON.bind(env)}]
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

  var sourceTrees = [app, config, 'vendor'].concat(broccoli.bowerTrees());

  if (env !== 'production') {
    var tests = pickFiles('tests', {
      srcDir: '/',
      destDir: prefix + '/tests'
    });

    tests = preprocessTemplates(tests);
    sourceTrees.push(tests);
  }

  var appAndDependencies = new broccoli.MergedTree(sourceTrees);

  // JavaScript

  var legacyFilesToAppend = [
    'jquery.js',
    'handlebars.js',
    'ember.js',
    'ic-ajax/dist/named-amd/main.js',
    'ember-data.js',
    'ember-resolver.js',
    'ember-shim.js'
  ];

  if (env !== 'production') {
    legacyFilesToAppend.push(
      'qunit/qunit/qunit.js',
      'qunit-shim.js',
      'ember-qunit/dist/named-amd/main.js'
    );
  }

  var applicationJs = preprocessJs(appAndDependencies, '/', prefix);

  applicationJs = compileES6(applicationJs, {
    loaderFile: 'loader/loader.js',
    ignoredModules: [
      'ember/resolver',
      'ember-qunit',
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

  var styles = preprocessCss(sourceTrees, prefix + '/styles', '/assets');

  var qunitStyles = pickFiles('vendor', {
    srcDir: '/qunit/qunit',
    files: ['qunit.css'],
    destDir: '/assets/'
  });

  // Ouput

  var outputTrees = [
    indexHTML,
    applicationJs,
    'public',
    styles
  ];

  if (env !== 'production') {
    outputTrees.push(qunitStyles, testsIndexHTML);
  }

  return outputTrees;
};
