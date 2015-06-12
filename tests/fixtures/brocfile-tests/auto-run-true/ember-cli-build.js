/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(project) {
  var app = new EmberApp({
    project: project,
    autoRun: true
  });

  return app.toTree();
};
