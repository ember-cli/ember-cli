/* global require, module */
var filterTemplates = require('broccoli-template');
var uglifyJavaScript = require('broccoli-uglify-js');
var compileES6 = require('broccoli-es6-concatenator');
var preprocessors = require('ember-cli/lib/preprocessors');
var pickFiles = require('broccoli-static-compiler');
var env = require('broccoli-env').getEnv();

var preprocessCss = preprocess.preprocessCss;

function preprocess (tree) {
  return filterTemplates(tree, {
    extensions: [
      'hbs',
      'handlebars'
    ],
    compileFunction: 'Ember.Handlebars.compile'
  });
}

module.exports = function (broccoli) {
  var app = broccoli.makeTree('app');
  var tests = broccoli.makeTree('tests');
  var publicFiles = broccoli.makeTree('public');
  var vendor = broccoli.makeTree('vendor');
  var config = broccoli.makeTree('config');
  var styles;

  app = pickFiles(app, {
    srcDir: '/',
    destDir: '<%= modulePrefix %>'
  });

  app = preprocess(app);

  tests = pickFiles(tests, {
    srcDir: '/',
    destDir: '<%= modulePrefix %>/tests'
  });

  tests = preprocess(tests);

  config = pickFiles(config, {
    srcDir: '/',
    files: ['environment.js', 'environments/' + env + '.js'],
    destDir: '<%= modulePrefix %>/config'
  });

  var sourceTrees = [
    app,
    config,
    vendor
  ];

  if (env !== 'production') {
    //sourceTrees.push(tests);
  }

  sourceTrees = sourceTrees.concat(broccoli.bowerTrees());

  var appAndDependencies = new broccoli.MergedTree(sourceTrees);

  var applicationJs = compileES6(appAndDependencies, {
    loaderFile: 'loader.js',
    ignoredModules: [
      'ember/resolver'
    ],
    inputFiles: [
      '<%= modulePrefix %>/**/*.js'
    ],
    legacyFilesToAppend: [
      '<%= modulePrefix %>/config/environment.js',
      '<%= modulePrefix %>/config/environments/' + env + '.js',
      'jquery.js',
      'handlebars.js',
      'ember.js',
      'ic-ajax/main.js',
      'ember-data.js',
      'ember-resolver.js'
    ],

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

  return [
    applicationJs,
    publicFiles,
    styles
  ];
};
