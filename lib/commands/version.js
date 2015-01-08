'use strict';

var Command       = require('../models/command');
var getVersions   = require('../utilities/get-versions');
var versions      = getVersions.versions;
var printVersions = getVersions.printVersions;

module.exports = Command.extend({
  name: 'version',
  description: 'outputs ember-cli version',
  works: 'everywhere',

  availableOptions: [
    { name: 'verbose', type: Boolean, default: false }
  ],

  aliases: ['v', 'version', '-v', '--version'],
  run: function(options) {
    var _versions = versions();
    printVersions(this.ui, _versions, options.verbose);
  }
});
