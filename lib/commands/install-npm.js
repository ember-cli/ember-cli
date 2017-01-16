'use strict';

const Command = require('../models/command');
const SilentError = require('silent-error');
const Promise = require('rsvp').Promise;

module.exports = Command.extend({
  name: 'install:npm',
  description: 'Npm package installs are now managed by the user.',
  works: 'insideProject',
  skipHelp: true,

  anonymousOptions: [
    '<package-names...>',
  ],

  run() {
    let err = 'This command has been removed. Please use `npm install ';
    err += '<packageName> --save-dev --save-exact` instead.';
    return Promise.reject(new SilentError(err));
  },
});
