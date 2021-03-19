const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { isExperimentEnabled } = require('ember-cli/lib/experiments');

module.exports = function (defaults) {
  var app = new EmberApp(defaults, {
    outputPaths: {
      app: {
        html: 'my-app.html',
        css: {
          'app': '/css/app.css',
          'theme': '/css/theme/a.css'
        },
        js: '/js/app.js'
      },
      vendor: {
        css: '/css/vendor.css',
        js: '/js/vendor.js'
      },
      testSupport: {
        css: '/css/test-support.css',
        js: {
          testSupport: '/js/test-support.js',
          testLoader: '/js/test-loader.js'
        }
      }
    }
  });

  if (isExperimentEnabled('EMBROIDER')) {
    const { Webpack } = require('@embroider/webpack');
    return require('@embroider/compat').compatBuild(app, Webpack);
  }

  return app.toTree();
};
