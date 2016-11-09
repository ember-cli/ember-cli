'use strict';

var Command = require('./internal-command');

module.exports = Command.extend({
  isRoot: true,
  name: 'ember',

  anonymousOptions: [
    '<command (Default: help)>'
  ]
});
