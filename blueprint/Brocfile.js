/* global require, module */

var uglifyJavaScript = require('broccoli-uglify-js');
var replace = require('broccoli-replace');
var compileES6 = require('broccoli-es6-concatenator');
var pickFiles = require('broccoli-static-compiler');
var mergeTrees = require('broccoli-merge-trees');

var env = require('broccoli-env').getEnv();
var getEnvJSON = require('./config/environment');

var p = require('ember-cli/lib/preprocessors');
var preprocessCss = p.preprocessCss;
var preprocessTemplates = p.preprocessTemplates;
var preprocessJs = p.preprocessJs;

module.exports = function (broccoli) {

  var prefix = '<%= modulePrefix %>';
  var rootURL = '/';

  // Index HTML Files

  var indexHTML = pickFiles('app', {
    srcDir: '/',
    files: ['index.html'],
    destDir: '/'
  });

  indexHTML = replace(indexHTML, {
    files: ['index.html'],
    patterns: [{ match: /\{\{ENV\}\}/g, replacement: getEnvJSON.bind(null, env)}]
  });

  var indexHTMLs = [indexHTML];

  if (env !== 'production') {
    var testsIndexHTML = pickFiles('tests', {
      srcDir: '/',
      files: ['index.html'],
      destDir: '/tests'
    });

    testsIndexHTML = replace(testsIndexHTML, {
      files: ['tests/index.html'],
      patterns: [{ match: /\{\{ENV\}\}/g, replacement: getEnvJSON.bind(null, env)}]
    });

    indexHTMLs.push(testsIndexHTML);
  }

  // Source Files

  var app = pickFiles('app', {
    srcDir: '/',
    destDir: prefix
  });

  var config = pickFiles('config', { // Don't pick anything, just watch config folder
    srcDir: '/',
    files: [],
    destDir: '/'
  });

  var sourceFiles = [preprocessTemplates(app), config, 'vendor'];

  if (env !== 'production') {
    var tests = pickFiles('tests', {
      srcDir: '/',
      destDir: prefix + '/tests'
    });

    sourceFiles.push(preprocessTemplates(tests))
  }

  sourceFiles = sourceFiles.concat(broccoli.bowerTrees());
  var appAndDependencies = mergeTrees(sourceFiles, { overwrite: true });

  // Styles

  var styles = [preprocessCss(appAndDependencies, prefix + '/styles', '/assets')];

  if (env !== 'production') {
    var qunitStyles = pickFiles('vendor', {
      srcDir: '/qunit/qunit',
      files: ['qunit.css'],
      destDir: '/assets/'
    });

    styles.push(qunitStyles);
  }

  // JavaScripts

  var scripts = preprocessJs(appAndDependencies, '/', prefix);

  var legacyFilesToAppend = [
    'jquery.js',
    'handlebars.js',
    'ember.js',
    'ic-ajax/dist/named-amd/main.js',
    'ember-data.js',
    'ember-resolver.js',
    'ember-shim.js'
  ];

  var ignoredModules = [
    'ember/resolver',
    'ic-ajax'
  ];

  if (env !== 'production') {
    legacyFilesToAppend = legacyFilesToAppend.concat([
      'qunit/qunit/qunit.js',
      'qunit-shim.js',
      'ember-qunit/dist/named-amd/main.js'
    ]);

    ignoredModules.push('ember-qunit');
  }

  scripts = compileES6(scripts, {
    loaderFile: 'loader/loader.js',
    ignoredModules: ignoredModules,
    inputFiles: [
      prefix + '/**/*.js'
    ],
    legacyFilesToAppend: legacyFilesToAppend,
    wrapInEval: env !== 'production',
    outputFile: '/assets/app.js'
  });

  if (env === 'production') {
    scripts = uglifyJavaScript(scripts, {
      mangle: false,
      compress: false
    });
  }

  var trees = indexHTMLs.concat(sourceFiles, 'public', styles, scripts);
  return mergeTrees(trees, { overwrite: true });
};
