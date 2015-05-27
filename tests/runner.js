'use strict';

var glob = require('glob');
var Mocha = require('mocha');
var RSVP = require('rsvp');
var mochaOnlyDetector = require('mocha-only-detector');

if (process.env.EOLNEWLINE) {
  require('os').EOL = '\n';
}

var root = 'tests/{unit,acceptance}';
var _checkOnlyInTests = RSVP.denodeify(mochaOnlyDetector.checkFolder.bind(null, root + '/**/*{-test,-slow}.js'));
var optionOrFile = process.argv[2];
var mocha = new Mocha({
  timeout: 5000,
  reporter: 'spec'
});

if (optionOrFile === 'all') {
  addFiles(mocha, '/**/*-test.js');
  addFiles(mocha, '/**/*-slow.js');
} else if (optionOrFile)  {
  mocha.addFile(optionOrFile);
} else {
  addFiles(mocha, '/**/*-test.js');
}

function addFiles(mocha, files) {
  glob.sync(root + files).forEach(mocha.addFile.bind(mocha));
}

function checkOnlyInTests() {
  console.log('Verifing `.only` in tests');
  return _checkOnlyInTests().then(function() {
    console.log('No `.only` found');
  });
}

function runMocha() {
  mocha.run(function(failures) {
    process.on('exit', function() {
      process.exit(failures);
    });
  });
}

function ciVerificationStep() {
  if (process.env.CI === 'true') {
    return checkOnlyInTests();
  } else {
    return RSVP.resolve();
  }
}

ciVerificationStep()
  .then(function() {
    runMocha();
  })
  .catch(function(error) {
    console.error(error);
    process.exit(1);
  });
