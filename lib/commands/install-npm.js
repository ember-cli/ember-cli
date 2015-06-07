'use strict';

var Command     = require('../models/command');
var SilentError = require('silent-error');
var Promise     = require('../ext/promise');

module.exports = Command.extend({
  name: 'install:npm',
  description: 'Npm package installs are now managed by the user.',
  works: 'insideProject',

  anonymousOptions: [
    '<package-names...>'
  ],

  run: function() {
    var err  = 'This command has been removed. Please use `npm install ';
    err     += '<packageName> --save-dev --save-exact` instead.';
    err     += 'Add `--cache-min=999999` to make npm use locally cached ';
    err     += 'packages where possible';
    return Promise.reject(new SilentError(err));
  }
});
