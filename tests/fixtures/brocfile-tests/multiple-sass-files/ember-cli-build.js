const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { isExperimentEnabled } = require('ember-cli/lib/experiments');

module.exports = function (defaults) {
  var app = new EmberApp(defaults, {
    name: require('./package.json').name,
  });

  if (isExperimentEnabled('EMBROIDER')) {
    const { Webpack } = require('@embroider/webpack');
    return require('@embroider/compat').compatBuild(app, Webpack);
  }

  return app.toTree();
};
