/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (project) {
  var app = new EmberApp({
    project: project,
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
        js: '/js/test-support.js'
      }
    }
  });

  return app.toTree();
};