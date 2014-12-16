'use strict';

var glob = require('glob');
var Mocha = require('mocha');

var mocha = new Mocha({
  timeout: 5000,
  reporter: 'spec'
});

var arg = process.argv[2];
var root = 'tests/{unit,acceptance}';

function addFiles(mocha, files) {
  glob.sync(root + files).forEach(mocha.addFile.bind(mocha));
}

addFiles(mocha, '/**/*-test.js');

if (arg === 'all') {
  addFiles(mocha, '/**/*-slow.js');
}

mocha.run(function(failures) {
  process.on('exit', function() {
    process.exit(failures);
  });
});
