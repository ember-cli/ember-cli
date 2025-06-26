const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const Funnel = require('broccoli-funnel');
const { isExperimentEnabled } = require('@ember/blueprint-model/utilities/experiments');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {});

  let funnel = new Funnel('vendor', {
    srcDir: '/',
    destDir: '/assets'
  });

  if (isExperimentEnabled('EMBROIDER')) {
    const { Webpack } = require('@embroider/webpack');
    return require('@embroider/compat').compatBuild(app, Webpack, {
      extraPublicTrees: [funnel]
    });
  }

  return app.toTree(funnel);
};
