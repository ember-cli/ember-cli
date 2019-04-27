'use strict';

const Command = require('../models/command');

module.exports = Command.extend({
  isRoot: true,
  name: 'ember',

  anonymousOptions: ['<command (Default: help)>'],
});
