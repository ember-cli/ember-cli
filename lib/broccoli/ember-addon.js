/* global require, module */
'use strict';

/**
@module ember-cli
*/
var merge    = require('lodash-node/modern/objects/merge');
var Funnel   = require('broccoli-funnel');
var defaults = require('lodash-node/modern/objects/defaults');
var EmberApp = require('./ember-app');
var Funnel   = require('broccoli-funnel');
var escapeRegExp = require('../utilities/escape-regexp');

module.exports = EmberAddon;

/**
  EmberAddon is used during addon development.

  @class EmberAddon
  @extends EmberApp
  @constructor
  @param options
*/
function EmberAddon(options) {
  options = options || {};
  process.env.EMBER_ADDON_ENV = process.env.EMBER_ADDON_ENV || 'development';

  this.appConstructor(merge(options, {
    name: 'dummy',
    configPath: './tests/dummy/config/environment',
    trees: {
      app: 'tests/dummy/app',
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
  }, defaults));
}

EmberAddon.prototype = Object.create(EmberApp.prototype);
EmberAddon.prototype.constructor = EmberAddon;
EmberAddon.prototype.appConstructor = EmberApp.prototype.constructor;

EmberAddon.prototype.addonTreesFor = function(type) {
  var project = this.project;
  return project.addons.map(function(addon) {
    if (addon.name == project.name()) {
      this.currentAddon = addon;
      return;
    }
    if (addon.treeFor && addon.name != project.name()) {
      return addon.treeFor(type);
    }
  }, this).filter(Boolean);
};

EmberAddon.prototype.currentAddonTree = function() {
  var addonTree = this.currentAddon.treeFor('addon');
  return new Funnel(addonTree, {
    destDir: this.project.name() + '/',
    description: 'Funnel: Current addon'
  });
};

EmberAddon.prototype.toArray = function() {
  var sourceTrees = [
    this.index(),
    this.javascript(),
    this.styles(),
    this.otherAssets(),
    this.publicTree(),
    this.currentAddonTree()
  ];

  if (this.tests) {
    sourceTrees = sourceTrees.concat(this.testIndex(), this.testFiles());
  }

  return sourceTrees;
};
