/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(project) {
  var app = new EmberApp({
    project: project,
    name: require('./package.json').name,
    wrapInEval: true,
    getEnvJSON: require('./config/environment')
  });
  
  return app.toTree();
};



