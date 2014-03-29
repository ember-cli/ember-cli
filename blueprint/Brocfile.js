/* global require, module */

var uglifyJavaScript = require('broccoli-uglify-js');
var compileES6 = require('broccoli-es6-concatenator');
var p = require('ember-cli/lib/preprocessors');
var pickFiles = require('broccoli-static-compiler');
var env = require('broccoli-env').getEnv();

var preprocessCss = p.preprocessCss;
var preprocessTemplates = p.preprocessTemplates;
var preprocessJs = p.preprocessJs;

module.exports = function (broccoli) {
  var app = 'app';
  var tests = 'tests';
  var publicFiles = 'public';
  var vendor = 'vendor';
  var config = 'config';
  var styles;
  var qunit;
  var testsIndex;

  app = pickFiles(app, {
    srcDir: '/',
    destDir: '<%= modulePrefix %>/'
  });

  app = preprocessTemplates(app);

  config = pickFiles(config, {
    srcDir: '/',
    files: [
      'environment.*',
      'environments/' + env + '.*'
    ],
    destDir: '<%= modulePrefix %>/config'
  });

  testsIndex = pickFiles(tests, {
    srcDir: '/',
    files: ['index.html'],
    destDir: '/tests'
  });

  tests = pickFiles(tests, {
    srcDir: '/',
    destDir: '<%= modulePrefix %>/tests'
  });

  qunit = pickFiles(vendor, {
    srcDir: '/qunit/qunit',
    files: ['qunit.css'],
    destDir: '/assets/'
  });

  tests = preprocessTemplates(tests);

  var sourceTrees = [
    app,
    config,
    vendor
  ];

  var legacyFilesToAppend = [
    '<%= modulePrefix %>/config/environment.js',
    '<%= modulePrefix %>/config/environments/' + env + '.js',
    'jquery.js',
    'handlebars.js',
    'ember.js',
    'ic-ajax/main.js',
    'ember-data.js',
    'ember-resolver.js'
  ];

  if (env !== 'production') {
    legacyFilesToAppend.push(
      'ember-shim.js',
      'qunit/qunit/qunit.js',
      'qunit-shim.js',
      'ember-qunit/dist/named-amd/main.js'
    );

    sourceTrees.push(tests);
  }

  sourceTrees = sourceTrees.concat(broccoli.bowerTrees());

  var appAndDependencies = new broccoli.MergedTree(sourceTrees);

  appAndDependencies = preprocessJs(appAndDependencies, '/', '<%= modulePrefix %>');

  var applicationJs = compileES6(appAndDependencies, {
    loaderFile: 'loader.js',
    ignoredModules: [
      'ember/resolver',
      'ember-qunit'
    ],
    inputFiles: [
      '<%= modulePrefix %>/**/*.js'
    ],
    legacyFilesToAppend: legacyFilesToAppend,

    wrapInEval: env !== 'production',
    outputFile: '/assets/app.js'
  });

  styles = preprocessCss(sourceTrees, '<%= modulePrefix %>/styles', '/assets');

  if (env === 'production') {
    applicationJs = uglifyJavaScript(applicationJs, {
      mangle: false,
      compress: false
    });
  }

  var outputTrees = [
    applicationJs,
    publicFiles,
    styles
  ];

  if (env !== 'production') {
    outputTrees.push(qunit, testsIndex);
  }

  return outputTrees;
};
