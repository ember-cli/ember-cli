/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var push = Array.prototype.push;

var app = new EmberApp({
  name: require('./package.json').name,

  legacyFilesToAppend: [
    'jquery.js',
    'handlebars.js',
    'ember.js',
    'ic-ajax/dist/named-amd/main.js',
    'ember-data.js',
    'app-shims.js',
    'ember-resolver.js',
    'ember-load-initializers.js'
  ],

  // AKA whitelisted modules
  ignoredModules: [
    'ember',
    'ember/resolver',
    'ember/load-initializers',
    'ic-ajax'
  ],

  // hack we can hopefully remove as the addon system improves
  importWhitelist: {
    'ember': ['default'],
    'ember/resolver': ['default'],
    'ember/load-initializers': ['default'],
    'ember-qunit': [
      'globalize',
      'moduleFor',
      'moduleForComponent',
      'moduleForModel',
      'test',
      'setResolver'
    ],
    'qunit': ['default']
  },

  // hack
  getEnvJSON: require('./config/environment')
});

if (app.env !== 'production') {
  push.apply(app.ignoredModules, [
    'qunit',
    'ember-qunit'
  ]);

  push.apply(app.legacyFilesToAppend, [
    'test-shims.js',
    'ember-qunit/dist/named-amd/main.js'
  ]);
}

module.exports = app.toTree();
