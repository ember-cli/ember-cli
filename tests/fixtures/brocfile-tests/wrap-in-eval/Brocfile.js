/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

var app = new EmberApp({
  name: require('./package.json').name,

  wrapInEval: true,

  getEnvJSON: require('./config/environment')
});

module.exports = app.toTree();
