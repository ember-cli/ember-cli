'use strict';

var NewCommand = require('./new');
var path       = require('path');

module.exports = NewCommand.extend({
  name: 'addon',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false },
    { name: 'verbose', type: Boolean, default: false },
    { name: 'blueprint', type: path, default: 'addon' },
    { name: 'skip-npm', type: Boolean, default: false },
    { name: 'skip-bower', type: Boolean, default: false },
    { name: 'skip-git', type: Boolean, default: false },
  ],

  anonymousOptions: [
    '<addon-name>'
  ]
});
