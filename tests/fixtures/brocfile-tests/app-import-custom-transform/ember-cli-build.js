const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const map = require('broccoli-stew').map;

module.exports = function (defaults) {
  var app = new EmberApp(defaults, {
  });

  app.import('vendor/custom-transform-example.js', {
    using: [
      {
        transformation: 'fastbootShim'
      }
    ],
    outputFile: '/assets/output.js'
  });

  app.import('vendor/custom-transform-example.js', {
    using: [
      {
        transformation: 'dubiousShim'
      }
    ],
    outputFile: '/assets/output-no-transform.js'
  });

  return app.toTree();
};