'use strict';

var fs      = require('fs-extra');
var Builder = require('../../../lib/models/builder');
var touch   = require('../../helpers/file-utils').touch;
var assert  = require('assert');

describe('models/builder.js', function() {
  var builder, outputPath;

  it('clears the outputPath when multiple files are present', function() {
    outputPath     = 'tmp/builder-fixture/';
    var firstFile  = outputPath + '/assets/foo-bar.js';
    var secondFile = outputPath + '/assets/baz-bif.js';

    fs.mkdirsSync(outputPath + '/assets/');
    touch(firstFile);
    touch(secondFile);

    builder = new Builder({
      setupBroccoliBuilder: function() { },
      trapSignals:          function() { },
      cleanupOnExit:        function() { },

      outputPath: outputPath
    });

    return builder.clearOutputPath()
      .then(function() {
        assert(!fs.existsSync(firstFile));
        assert(!fs.existsSync(secondFile));
      });
  });
});
