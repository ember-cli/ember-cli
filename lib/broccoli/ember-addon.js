/* global require, module */
'use strict';

var merge         = require('lodash-node/modern/objects/merge');
var remove        = require('broccoli-file-remover');
var defaults      = require('lodash-node/modern/objects/defaults');
var EmberApp      = require('ember-cli/lib/broccoli/ember-app');
var unwatchedTree = require('broccoli-unwatched-tree');

module.exports = EmberAddon;

function EmberAddon(options) {
  options = options || {};
  process.env.EMBER_ADDON_ENV = process.env.EMBER_ADDON_ENV || 'development';

  return new EmberApp(merge(options, {
    name: 'dummy',
    environment: './tests/dummy/config/environment',
    trees: {
      app: 'tests/dummy/app',
      styles: 'tests/dummy/app/styles',
      templates: 'tests/dummy/app/templates',
      tests: remove('tests', {path: 'dummy'}),
      vendor: unwatchedTree('vendor')
    },
    jshintrc: {
      tests: './tests',
      app: './tests/dummy'
    },
  }, defaults));
}
