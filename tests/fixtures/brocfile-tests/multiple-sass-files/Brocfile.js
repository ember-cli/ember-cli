/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

var app = new EmberApp({
  name: require('./package.json').name,
  outputPaths: { app: { css: { 'main': '/assets/main.css', 'theme/a': '/assets/theme/a.css' } } }
});

module.exports = app.toTree();
