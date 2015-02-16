/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var name = require('./package.json').name;

var app = new EmberApp({
  name: name,
  outputPaths: { app: { css: { 'app': '/assets/'+name+'.css', 'theme': '/assets/theme.css' } } }
});

module.exports = app.toTree();
