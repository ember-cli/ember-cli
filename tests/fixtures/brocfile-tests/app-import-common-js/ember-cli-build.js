const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  var app = new EmberApp(defaults, {
  });

  app.import('vendor/common-js-example.js', {
    using: [
      { transformation: 'amd',  as: 'hello-world'}
    ],
    outputFile: '/assets/output.js'
  });

  return app.toTree();
};