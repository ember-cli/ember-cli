'use strict';

var broccoli = require('broccoli');
var fs = require('fs');
var RSVP = require('rsvp');
var ncp = require('ncp');
var rimraf = require('rimraf');
var builder = require('./builder');

ncp.limit = 1;

module.exports = function build(options) {
  return builder(broccoli, options.appRoot).build()
    .then(function (dir) {
      var outputDir = options.outputPath || 'dist/';

      // Cleanup dist folder before building again
      if( fs.existsSync(outputDir) ) {
        rimraf.sync(outputDir);
      }

      fs.mkdirSync(outputDir);

      return RSVP.denodeify(ncp)(dir, outputDir, {
        clobber: true,
        stopOnErr: true
      });
    });
};
