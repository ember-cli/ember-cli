/* global require, module */
'use strict';

/**
@module ember-cli
*/
var defaults = require('merge-defaults');
var Babel  = require('broccoli-babel-transpiler');
var Funnel   = require('broccoli-funnel');
var EmberApp = require('./ember-app');

module.exports = EmberAddon;

/**
  EmberAddon is used during addon development.

  @class EmberAddon
  @extends EmberApp
  @constructor
  @param options
*/
function EmberAddon() {
  var args = [];
  var options = {};

  for (var i = 0, l = arguments.length; i < l; i++) {
    args.push(arguments[i]);
  }

  if (args.length === 1) {
    options = args[0];
  } else if (args.length > 1) {
    args.reverse();
    options = defaults.apply(null, args);
  }

  process.env.EMBER_ADDON_ENV = process.env.EMBER_ADDON_ENV || 'development';

  this.appConstructor(defaults(options, {
    name: 'dummy',
    configPath: './tests/dummy/config/environment',
    trees: {
      app: 'tests/dummy/app',
      entry: new Funnel('./', {
        include: ['index.js']
      }),
      styles: 'tests/dummy/app/styles',
      templates: 'tests/dummy/app/templates',
      public: 'tests/dummy/public',
      tests: new Funnel('tests', {
        exclude: [ /^dummy/ ]
      })
    },
    jshintrc: {
      tests: './tests',
      app: './tests/dummy'
    },
  }));
}

function buildTestTrees(testTrees) {
  testTrees = EmberApp.prototype.buildTestTrees.call(this, testTrees);

  var jshintedEntry = this.addonLintTree('entry', this.trees.entry);

  jshintedEntry = new Babel(new Funnel(jshintedEntry, {
    srcDir: '/',
    destDir: this.name + '/tests/',
    annotation: 'Funnel (jshint addon entry)'
  }), this._prunedBabelOptions());

  testTrees.push(jshintedEntry);

  return testTrees;
}

EmberAddon.prototype = Object.create(EmberApp.prototype);
EmberAddon.prototype.constructor = EmberAddon;
EmberAddon.prototype.appConstructor = EmberApp.prototype.constructor;
EmberAddon.prototype.buildTestTrees = buildTestTrees;
