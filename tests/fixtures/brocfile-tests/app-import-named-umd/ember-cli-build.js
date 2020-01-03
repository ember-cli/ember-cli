const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  var app = new EmberApp(defaults, {
  });

  app.import('vendor/named-umd-example.js', {
    using: [
      { transformation: 'amd'}
    ],
    outputFile: '/assets/output.js'
  });

  app.import('vendor/named-umd-example.js', {
    using: [
      { transformation: 'amd'}
    ],
    outputFile: '/assets/output.js'
  });

  return app.toTree();
};
