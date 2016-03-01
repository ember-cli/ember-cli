/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  var app = new EmberApp(defaults, {});

  app.legacyFilesToAppend.push('vendor/legacy-file.js');
  app.legacyFilesToAppend.push('vendor/second-legacy-file.js');
  app.vendorStaticStyles.push('vendor/legacy-file.css');

  return app.toTree();
};


