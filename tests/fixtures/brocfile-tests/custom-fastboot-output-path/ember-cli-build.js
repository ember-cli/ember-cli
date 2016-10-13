/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  var app = new EmberApp(defaults, {
    outputPaths: {
      fastboot: {
        app: 'fastboot/app.js'
      }
    }
  });

  return app.toTree();
};
