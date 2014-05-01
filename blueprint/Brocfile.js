/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

var app = new EmberApp({
  name: require('./package.json').name,

  // Use this to add the following modules to the generated application
  // file.
  legacyFilesToAppend: [
    'ember-data.js',
  ],

  // Use this to instruct the `broccoli-es6-concatenator` to allow
  // references to the following modules (this would commonly include
  // any modules exported from any AMD files added to `legacyFilesToAppend`)
  ignoredModules: [ ],

  // Use this to notify the import validator of any AMD modules
  // that you add to your project.
  importWhitelist: { },

  // hack
  getEnvJSON: require('./config/environment')
});

module.exports = app.toTree();
