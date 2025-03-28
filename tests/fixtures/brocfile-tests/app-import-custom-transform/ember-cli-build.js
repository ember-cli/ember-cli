const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { isExperimentEnabled } = require('@ember/blueprint-model/utilities/experiments');

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

  if (isExperimentEnabled('EMBROIDER')) {
    const { Webpack } = require('@embroider/webpack');
    return require('@embroider/compat').compatBuild(app, Webpack);
  }

  return app.toTree();
};
