var broccoli = require('broccoli');
var fs = require('fs');
var RSVP = require('rsvp');
var ncp = require('ncp');

ncp.limit = 1;

function getBuilder () {
  var tree = broccoli.loadBrocfile();
  return new broccoli.Builder(tree);
}

module.exports = function build(options) {
  return getBuilder().build()
    .then(function (dir) {
      var outputDir = options.outputPath || 'dist/';
      try {
        fs.mkdirSync(outputDir);
      } catch (err) {
        if (err.code !== 'EEXIST') {
          console.error('Error: "' + err);
        }
        process.exit(1);
      }

      return RSVP.denodeify(ncp)(dir, outputDir, {
        clobber: true,
        stopOnErr: true
      });
    });
};
