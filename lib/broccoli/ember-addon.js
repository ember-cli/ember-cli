/* global require, module */
'use strict';

var merge    = require('lodash-node/modern/objects/merge');
var remove   = require('broccoli-file-remover');
var defaults = require('lodash-node/modern/objects/defaults');
var EmberApp = require('./ember-app');

module.exports = EmberAddon;

function EmberAddon(options) {
  options = options || {};
  process.env.EMBER_ADDON_ENV = process.env.EMBER_ADDON_ENV || 'development';

  this.appConstructor(merge(options, {
    name: 'dummy',
    environment: './tests/dummy/config/environment',
    trees: {
      app: 'tests/dummy/app',
      styles: 'tests/dummy/app/styles',
      templates: 'tests/dummy/app/templates',
      tests: remove('tests', {path: 'dummy'})
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
EmberAddon.prototype.oldInitializeAddons = EmberApp.prototype.initializeAddons;

EmberAddon.prototype.initializeAddons = function() {
  this.project.addIfAddon(this.project.root);
  this.oldInitializeAddons();
};
