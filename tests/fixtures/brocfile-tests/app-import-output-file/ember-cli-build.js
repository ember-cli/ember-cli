/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  var app = new EmberApp(defaults, {});

  app.import('vendor/custom-output-file.js', {outputFile: '/assets/output-file.js'});
  app.import('vendor/custom-output-file.css', {outputFile: '/assets/output-file.css'});

  return app.toTree();
};

