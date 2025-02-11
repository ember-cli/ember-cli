'use strict';

const path = require('path');
const captureExit = require('capture-exit');
captureExit.captureExit();

const glob = require('glob');
const Mocha = require('mocha');
const mochaConfig = require(path.join(__dirname, '../.mocharc'));

const { chai } = require('./bootstrap');

const mocha = new Mocha(mochaConfig);

let root = 'tests/{unit,integration,acceptance}';
let optionOrFile = process.argv[2];
// default to `tap` reporter in CI otherwise default to `spec`
let testFiles = glob.sync(`${root}/**/*-test.js`);
let docsLintPosition = testFiles.indexOf('tests/unit/docs-lint-test.js');
let docsLint = testFiles.splice(docsLintPosition, 1);

testFiles = docsLint.concat(testFiles);

if (optionOrFile === 'all') {
  addFiles(mocha, testFiles);
  addFiles(mocha, '/**/*-slow.js');
} else if (optionOrFile === 'slow') {
  addFiles(mocha, '/**/*-slow.js');
} else if (optionOrFile === 'lint') {
  addFiles(mocha, docsLint);
} else if (process.argv.length > 2) {
  addFiles(mocha, process.argv.slice(2));
} else {
  addFiles(mocha, testFiles);
}

function addFiles(mocha, files) {
  files = typeof files === 'string' ? glob.sync(root + files) : files;
  files.forEach(mocha.addFile.bind(mocha));
}

function runMocha() {
  let ROOT = process.cwd();

  // ensure that at the end of every test, we are in the correct current
  // working directory
  mocha.suite.afterEach(function () {
    chai.expect(process.cwd()).to.equal(ROOT);
  });

  console.time('Mocha Tests Running Time');
  mocha.run((failures) => {
    console.timeEnd('Mocha Tests Running Time');

    console.log(`[Mocha Debug]`, failures, typeof failures);
    if (failures > 0) {
      // On Windows, process.exit at all causes exit code 1
      // eslint-disable-next-line n/no-process-exit
      process.exit(failures);
    }
  });
}

Promise.resolve()
  .then(() => runMocha())
  .catch((error) => {
    console.error(error);
    console.error(error.stack);

    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  });
