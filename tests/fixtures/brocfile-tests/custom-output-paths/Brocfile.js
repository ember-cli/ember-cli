/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

var app = new EmberApp({
  outputPaths: {
    app: {
      css: '/css/app.css',
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
