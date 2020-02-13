'use strict';

const Command = require('../models/command');
const SilentError = require('silent-error');

module.exports = Command.extend({
  name: 'uninstall:npm',
  description: 'Npm package uninstall are now managed by the user.',
  works: 'insideProject',
  skipHelp: true,

  anonymousOptions: ['<package-names...>'],

  run() {
    let err = 'This command has been removed. Please use `npm uninstall ';
    err += '<packageName> --save-dev` instead.';
    return Promise.reject(new SilentError(err));
  },
});
