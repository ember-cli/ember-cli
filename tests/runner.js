'use strict';

const captureExit = require('capture-exit');
captureExit.captureExit();

const glob = require('glob');
const Mocha = require('mocha');
const RSVP = require('rsvp');
const fs = require('fs-extra');
const mochaOnlyDetector = require('mocha-only-detector');

if (process.env.EOLNEWLINE) {
  require('os').EOL = '\n';
}

fs.removeSync('.deps-tmp');

let root = 'tests/{unit,integration,acceptance}';
let _checkOnlyInTests = RSVP.denodeify(mochaOnlyDetector.checkFolder.bind(null, `${root}/**/*{-test,-slow}.js`));
let optionOrFile = process.argv[2];
// default to `tap` reporter in CI otherwise default to `spec`
let reporter = process.env.MOCHA_REPORTER || (process.env.CI ? 'tap' : 'spec');
let mocha = new Mocha({
  timeout: 5000,
  reporter,
  retries: 2,
});
let testFiles = glob.sync(`${root}/**/*-test.js`);
let lintPosition = testFiles.indexOf('tests/unit/lint-test.js');
let lint = testFiles.splice(lintPosition, 1);
let docsLintPosition = testFiles.indexOf('tests/unit/docs-lint-test.js');
let docsLint = testFiles.splice(docsLintPosition, 1);

testFiles = lint.concat(docsLint).concat(testFiles);

if (optionOrFile === 'all') {
  addFiles(mocha, testFiles);
  addFiles(mocha, '/**/*-slow.js');
} else if (optionOrFile === 'slow') {
  addFiles(mocha, '/**/*-slow.js');
} else if (optionOrFile === 'lint') {
  addFiles(mocha, lint);
  addFiles(mocha, docsLint);
} else if (process.argv.length > 2) {
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
  return _checkOnlyInTests()
    .then(() => console.log('No `.only` found'));
}

function runMocha() {
  console.time('Mocha Tests Running Time');
  mocha.run(failures => {
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
  .then(() => runMocha())
  .catch(error => {
    console.error(error);
    console.error(error.stack);
    process.exit(1);
  });
