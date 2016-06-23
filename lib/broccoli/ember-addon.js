/* global require, module */
'use strict';

/**
@module ember-cli
*/
var defaultsDeep = require('ember-cli-lodash-subset').defaultsDeep;
var Funnel   = require('broccoli-funnel');
var EmberApp = require('./ember-app');

module.exports = EmberAddon;

/**
  EmberAddon is used during addon development.

  @class EmberAddon
  @extends EmberApp
  @constructor
  @param {Object} [defaults]
  @param {Object} [options={}] Configuration options
*/
function EmberAddon(defaults, options) {
  if (arguments.length === 0) {
    options = {};
  } else if (arguments.length === 1) {
    options = defaults;
  } else {
    defaultsDeep(options, defaults);
  }

  process.env.EMBER_ADDON_ENV = process.env.EMBER_ADDON_ENV || 'development';

  this.appConstructor(defaultsDeep(options, {
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
  }));
}

EmberAddon.__proto__ = EmberApp;

EmberAddon.prototype = Object.create(EmberApp.prototype);
EmberAddon.prototype.constructor = EmberAddon;
EmberAddon.prototype.appConstructor = EmberApp.prototype.constructor;
