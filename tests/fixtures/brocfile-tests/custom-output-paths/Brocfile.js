/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

var app = new EmberApp({
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

module.exports = app.toTree();
