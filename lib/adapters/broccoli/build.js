var broccoli = require('broccoli'),
  fs = require('fs'),
  RSVP = require('rsvp'),
  ncp = require('ncp');

  ncp.limit = 1;

function getBuilder () {
  var tree = broccoli.loadBrocfile();
  return new broccoli.Builder(tree);
}

module.exports = function build(options, done){
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
