'use strict';

var NewCommand = require('./new');

module.exports = NewCommand.extend({
  name: 'addon',
  description: 'Generates a new folder structure for building an addon, complete with test harness.',

  availableOptions: [
    { name: 'dry-run',    type: Boolean, default: false,   aliases: ['d'], description: 'Dry run, simulate addon generation without affecting your project' },
    { name: 'verbose',    type: Boolean, default: false,   aliases: ['v'], description: 'Verbose output' },
    { name: 'blueprint',  type: String,  default: 'addon', aliases: ['b'], description: 'Specify addon blueprint' },
    { name: 'skip-npm',   type: Boolean, default: false,   aliases: ['sn'], description: 'Skip installing npm packages' },
    { name: 'skip-bower', type: Boolean, default: false,   aliases: ['sb'], description: 'Skip installing bower packages' },
    { name: 'skip-git',   type: Boolean, default: false,   aliases: ['sg'], description: 'Skip creating a git repository' }
  ],

  anonymousOptions: [
    '<addon-name>'
  ]
});
