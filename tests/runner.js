'use strict';

const captureExit = require('capture-exit');
captureExit.captureExit();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiFiles = require('chai-files');
const chaiJestSnapshot = require('chai-jest-snapshot');
const ciInfo = require('ci-info');
const glob = require('glob');
const Mocha = require('mocha');

chai.use(chaiFiles);
chai.use(chaiAsPromised);
chai.use(chaiJestSnapshot);

if (process.env.EOLNEWLINE) {
  require('os').EOL = '\n';
}

let root = 'tests/{unit,integration,acceptance}';
let optionOrFile = process.argv[2];
// default to `tap` reporter in CI otherwise default to `spec`
let reporter = process.env.MOCHA_REPORTER || (ciInfo.isCI ? 'tap' : 'spec');
let mocha = new Mocha({
  timeout: 5000,
  reporter,
  retries: 2,
  parallel: true,
  rootHooks: {
    beforeEach() {
      chaiJestSnapshot.resetSnapshotRegistry();
      chaiJestSnapshot.configureUsingMochaContext(this);
    },
  },
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
  let ROOT = process.cwd();

  // ensure that at the end of every test, we are in the correct current
  // working directory
  mocha.suite.afterEach(function () {
    chai.expect(process.cwd()).to.equal(ROOT);
  });

  console.time('Mocha Tests Running Time');
  mocha.run((failures) => {
    console.timeEnd('Mocha Tests Running Time');

    // eslint-disable-next-line n/no-process-exit
    process.exit(failures);
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
