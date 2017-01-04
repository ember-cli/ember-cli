/* global require, module */

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  var app = new EmberApp(defaults, {
    configPath: 'config/something-else'
  });

  return app.toTree();
};
