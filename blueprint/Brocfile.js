/* global require, module */

var env = require('broccoli-env').getEnv();
var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var push = Array.prototype.push;

var app = new EmberApp(env, {
  name: require('./package.json').name,

  legacyFilesToAppend: [
    'jquery.js',
    'handlebars.js',
    'ember.js',
    'ic-ajax/dist/named-amd/main.js',
    'ember-data.js',
    'app-shims.js',
    'ember-resolver.js',
    'ember-load-initializers.js',
    'emberfire.js'
  ],

  // AKA whitelisted modules
  ignoredModules: [
    'ember',
    'ember/resolver',
    'ember/load-initializers',
    'ic-ajax'
  ],

  // hack
  getEnvJSON: require('./config/environment')
});

if (env !== 'production') {
  push.apply(app.ignoredModules, [
    'qunit',
    'ember-qunit'
  ]);

  push.apply(app.legacyFilesToAppend, [
    'qunit/qunit/qunit.js',
    'test-shims.js',
    'ember-qunit/dist/named-amd/main.js'
  ]);
}

module.exports = app.toTree();
