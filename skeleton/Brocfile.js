/* global require, module */
var filterTemplates = require('broccoli-template');
var uglifyJavaScript = require('broccoli-uglify-js');
var compileES6 = require('broccoli-es6-concatenator');
// var compileSass = require('broccoli-sass');      // Uncomment for Sass support
var pickFiles = require('broccoli-static-compiler');
var env = require('broccoli-env').getEnv();

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
  var styles = broccoli.makeTree('styles');

  app = pickFiles(app, {
    srcDir: '/',
    destDir: '<%= namespace %>'
  });

  app = preprocess(app);

  styles = pickFiles(styles, {
    srcDir: '/',
    destDir: '<%= namespace %>/styles' 
  });

  styles = preprocess(styles);

  tests = pickFiles(tests, {
    srcDir: '/',
    destDir: '<%= namespace %>/tests'
  });

  tests = preprocess(tests);

  var sourceTrees = [
    app,
    // styles,          // Uncomment for Sass support
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
      '<%= namespace %>/**/*.js'
    ],
    legacyFilesToAppend: [
      'jquery.js',
      'handlebars.js',
      'ember.js',
      'ember-data.js',
      'ember-resolver.js'
    ],

    wrapInEval: env !== 'production',
    outputFile: '/assets/app.js'
  });

  // Uncomment for Sass support
  // var appCss = compileSass(sourceTrees, '<%= namespace %>/styles/app.scss', '/assets/app.css');

  if (env === 'production') {
    applicationJs = uglifyJavaScript(applicationJs, {
      mangle: false,
      compress: false
    });
  }

  return [
    applicationJs,
    publicFiles,
    // appCss,          // Uncomment for Sass support
    styles
  ];
};
