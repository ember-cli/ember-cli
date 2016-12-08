'use strict';

var captureExit = require('capture-exit');
captureExit.captureExit();

var glob = require('glob');
var Mocha = require('mocha');
var RSVP = require('rsvp');
var fs = require('fs-extra');
var mochaOnlyDetector = require('mocha-only-detector');

if (process.env.EOLNEWLINE) {
  require('os').EOL = '\n';
}

fs.removeSync('.deps-tmp');

var root = 'tests/{unit,integration,acceptance}';
var _checkOnlyInTests = RSVP.denodeify(mochaOnlyDetector.checkFolder.bind(null, root + '/**/*{-test,-slow}.js'));
var optionOrFile = process.argv[2];
var mocha = new Mocha({
  timeout: 5000,
  reporter: process.env.MOCHA_REPORTER || 'spec',
  retries: 2
});
var testFiles = glob.sync(root + '/**/*-test.js');
var lintPosition = testFiles.indexOf('tests/unit/lint-test.js');
var lint = testFiles.splice(lintPosition, 1);
var docsLintPosition = testFiles.indexOf('tests/unit/docs-lint-test.js');
var docsLint = testFiles.splice(docsLintPosition, 1);

testFiles = lint.concat(docsLint).concat(testFiles);

if (optionOrFile === 'all') {
  addFiles(mocha, testFiles);
  addFiles(mocha, '/**/*-slow.js');
} else if (optionOrFile === 'slow')  {
  addFiles(mocha, '/**/*-slow.js');
} else if (optionOrFile === 'lint')  {
  addFiles(mocha, lint);
  addFiles(mocha, docsLint);
} else if (process.argv.length > 2)  {
  addFiles(mocha, process.argv.slice(2));
} else {
  addFiles(mocha, testFiles);
}

function addFiles(mocha, files) {
  files = (typeof files === 'string') ? glob.sync(root + files) : files;
  files.forEach(mocha.addFile.bind(mocha));
}

function checkOnlyInTests() {
  console.log('Verifing `.only` in tests');
  return _checkOnlyInTests().then(function() {
    console.log('No `.only` found');
  });
}

function runMocha() {
  console.time('Mocha Tests Running Time');
  mocha.run(function(failures) {
    console.timeEnd('Mocha Tests Running Time');
    process.exit(failures);
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
    console.error(error.stack);
    process.exit(1);
  });
