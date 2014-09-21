/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

var app = new EmberApp({
  configPath: 'config/something-else'
});

module.exports = app.toTree();

