/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(project) {
  var app = new EmberApp({
    project: project,
    configPath: 'config/something-else'
  });

  return app.toTree();
};
