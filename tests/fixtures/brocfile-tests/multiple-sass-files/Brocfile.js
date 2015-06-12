/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(project) {
  var app = new EmberApp({
    project: project,
    name: require('./package.json').name,
    outputPaths: { app: { css: { 'main': '/assets/main.css', 'theme/a': '/assets/theme/a.css' } } }
  });

  return app.toTree();
};