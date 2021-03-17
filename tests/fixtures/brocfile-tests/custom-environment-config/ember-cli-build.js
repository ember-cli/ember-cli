const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { isExperimentEnabled } = require('ember-cli/lib/experiments');

module.exports = function (defaults) {
  var app = new EmberApp(defaults, {
    configPath: 'config/something-else'
  });

  if (isExperimentEnabled('EMBROIDER')) {
    const { Webpack } = require('@embroider/webpack');
    return require('@embroider/compat').compatBuild(app, Webpack, {
      skipBabel: [{
        package: 'qunit'
      }]
    });
  }

  return app.toTree();
};
