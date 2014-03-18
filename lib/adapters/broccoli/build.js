'use strict';

var broccoli = require('broccoli');
var fs = require('fs');
var RSVP = require('rsvp');
var ncp = require('ncp');
var rimraf = require('rimraf');

ncp.limit = 1;

function getBuilder () {
  var tree = broccoli.loadBrocfile();
  return new broccoli.Builder(tree);
}

module.exports = function build(options) {
  return getBuilder().build()
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
