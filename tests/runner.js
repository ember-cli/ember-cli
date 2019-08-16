'use strict';

const captureExit = require('capture-exit');
captureExit.captureExit();

const glob = require('glob');
const Mocha = require('mocha');
const RSVP = require('rsvp');
const fs = require('fs-extra');

if (process.env.EOLNEWLINE) {
  require('os').EOL = '\n';
}

fs.removeSync('.deps-tmp');

let root = 'tests/{unit,integration,acceptance}';
let optionOrFile = process.argv[2];
// default to `tap` reporter in CI otherwise default to `spec`
let reporter = process.env.MOCHA_REPORTER || (process.env.CI ? 'tap' : 'spec');
let mocha = new Mocha({
  timeout: 5000,
  reporter,
  retries: 2,
});
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
  console.time('Mocha Tests Running Time');
  mocha.run(failures => {
    console.timeEnd('Mocha Tests Running Time');

    // eslint-disable-next-line no-process-exit
    process.exit(failures);
  });
}

RSVP.resolve()
  .then(() => runMocha())
  .catch(error => {
    console.error(error);
    console.error(error.stack);

    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
