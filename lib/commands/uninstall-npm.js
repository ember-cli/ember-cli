'use strict';

var Command     = require('../models/command');
var SilentError = require('../errors/silent');
var Promise     = require('../ext/promise');

module.exports = Command.extend({
  name: 'uninstall:npm',
  description: 'Npm package uninstall are now managed by the user.',
  works: 'insideProject',

  anonymousOptions: [
    '<package-names...>'
  ],

  run: function() {
    var err  = 'This command has been deprecated. Please use `npm uninstall ';
    err     += '<packageName> --save-dev` instead.';
    return Promise.reject(new SilentError(err));
  }
});
