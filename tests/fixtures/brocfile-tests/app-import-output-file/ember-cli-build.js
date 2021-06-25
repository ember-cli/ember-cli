const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { isExperimentEnabled } = require('ember-cli/lib/experiments');

module.exports = function (defaults) {
  var app = new EmberApp(defaults, {});

  app.import('vendor/custom-output-file.js', {outputFile: '/assets/output-file.js'});
  app.import('vendor/custom-output-file.css', {outputFile: '/assets/output-file.css'});

  if (isExperimentEnabled('EMBROIDER')) {
    const { Webpack } = require('@embroider/webpack');
    return require('@embroider/compat').compatBuild(app, Webpack);
  }

  return app.toTree();
};
