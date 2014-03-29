'use strict';

var broccoli = require('broccoli');
var fs = require('fs');
var RSVP = require('rsvp');
var denodeify = RSVP.denodeify;
var ncp = denodeify(require('ncp'));
var rimraf = require('rimraf');
var notifier = require('../../utilities/build-notifier');

ncp.limit = 1;

function getBuilder () {
  var tree = broccoli.loadBrocfile();
  return new broccoli.Builder(tree);
}

module.exports = function build(options) {
  notifier.installInto(broccoli);
  return getBuilder().build()
    .then(function (dir) {
      var outputDir = options.outputPath || 'dist/';

      // Cleanup dist folder before building again
      if( fs.existsSync(outputDir) ) {
        rimraf.sync(outputDir);
      }

      fs.mkdirSync(outputDir);

      return ncp(dir, outputDir, {
        clobber: true,
        stopOnErr: true
      }).then(function() {
        broccoli.notify(dir);
      });
    });
};
