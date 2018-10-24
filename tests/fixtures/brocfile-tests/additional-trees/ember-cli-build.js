const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const Funnel = require('broccoli-funnel');

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {});

  let funnel = new Funnel('vendor', {
    srcDir: '/',
    destDir: '/assets'
  });

  return app.toTree(funnel);
};
