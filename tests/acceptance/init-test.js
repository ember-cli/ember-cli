'use strict';

const ember = require('../helpers/ember');
const walkSync = require('walk-sync');
const glob = require('glob');
const Blueprint = require('../../lib/models/blueprint');
const path = require('path');
const fs = require('fs');
const os = require('os');
let root = process.cwd();
const util = require('util');
const minimatch = require('minimatch');
const intersect = require('lodash/intersection');
const remove = require('lodash/remove');
const EOL = require('os').EOL;
const td = require('testdouble');
const lintFix = require('../../lib/utilities/lint-fix');

const { expect } = require('chai');
const { dir, file } = require('chai-files');

let defaultIgnoredFiles = Blueprint.ignoredFiles;

describe('Acceptance: ember init', function () {
  this.timeout(20000);

  async function makeTempDir() {
    let baseTmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'init-test'));
    let projectDir = path.join(baseTmpDir, 'hello-world');

    await fs.promises.mkdir(projectDir);

    return projectDir;
  }

  let tmpPath;
  beforeEach(async function () {
    Blueprint.ignoredFiles = defaultIgnoredFiles;

    tmpPath = await makeTempDir();
    process.chdir(tmpPath);
  });

  afterEach(function () {
    td.reset();
    process.chdir(root);
  });

  function confirmBlueprinted(typescript = false) {
    let blueprintPath = path.join(root, 'blueprints', 'app', 'files');
    // ignore TypeScript files
    let expected = walkSync(blueprintPath, {
      ignore: ['tsconfig.json', 'types', 'app/config'],
    }).map((name) => (typescript ? name : name.replace(/\.ts$/, '.js')));

    // This style of assertion can't handle conditionally available files
    if (expected.some((x) => x.endsWith('eslint.config.mjs'))) {
      expected = [...expected.filter((x) => !x.endsWith('eslint.config.mjs')), 'eslint.config.mjs'];
    }
    // GJS and GTS files are also conditionally available
    expected = expected.filter((x) => !x.endsWith('.gjs') && !x.endsWith('.gts'));

    expected.sort();

    let actual = walkSync('.').sort();

    Object.keys(Blueprint.renamedFiles).forEach((srcFile) => {
      expected[expected.indexOf(srcFile)] = Blueprint.renamedFiles[srcFile];
    });

    removeIgnored(expected);
    removeIgnored(actual);

    removeTmp(expected);
    removeTmp(actual);

    expected.sort();

    expect(expected).to.deep.equal(
      actual,
      `${EOL} expected: ${util.inspect(expected)}${EOL} but got: ${util.inspect(actual)}`
    );
  }

  function confirmGlobBlueprinted(pattern) {
    let blueprintPath = path.join(root, 'blueprints', 'app', 'files');
    let actual = pickSync('.', pattern);
    let expected = intersect(actual, pickSync(blueprintPath, pattern));

    removeIgnored(expected);
    removeIgnored(actual);

    removeTmp(expected);
    removeTmp(actual);

    expected.sort();

    expect(expected).to.deep.equal(
      actual,
      `${EOL} expected: ${util.inspect(expected)}${EOL} but got: ${util.inspect(actual)}`
    );
  }

  function pickSync(filePath, pattern) {
    return glob
      .sync(`**/${pattern}`, {
        cwd: filePath,
        dot: true,
        mark: true,
        strict: true,
      })
      .sort();
  }

  function removeTmp(array) {
    remove(array, function (entry) {
      return /^tmp[\\/]$/.test(entry);
    });
  }
  function removeIgnored(array) {
    remove(array, function (fn) {
      return Blueprint.ignoredFiles.some(function (ignoredFile) {
        return minimatch(fn, ignoredFile, {
          matchBase: true,
        });
      });
    });
  }

  it('ember init', async function () {
    await ember(['init', '--skip-npm']);

    confirmBlueprinted();
  });

  it("init an already init'd folder", async function () {
    await ember(['init', '--skip-npm']);

    await ember(['init', '--skip-npm']);

    confirmBlueprinted();
  });

  it('init a single file', async function () {
    await ember(['init', 'app.js', '--skip-npm']);

    confirmGlobBlueprinted('app.js');
  });

  it("init a single file on already init'd folder", async function () {
    await ember(['init', '--skip-npm']);

    await ember(['init', 'app.js', '--skip-npm']);

    confirmBlueprinted();
  });

  it('init multiple files by glob pattern', async function () {
    await ember(['init', 'app/**', '--skip-npm']);

    confirmGlobBlueprinted('app/**');
  });

  it("init multiple files by glob pattern on already init'd folder", async function () {
    await ember(['init', '--skip-npm']);

    await ember(['init', 'app/**', '--skip-npm']);

    confirmBlueprinted();
  });

  it('init multiple files by glob patterns', async function () {
    await ember(['init', 'app/**', 'package.json', 'resolver.js', '--skip-npm']);

    confirmGlobBlueprinted('{app/**,package.json,resolver.js}');
  });

  it("init multiple files by glob patterns on already init'd folder", async function () {
    await ember(['init', '--skip-npm']);

    await ember(['init', 'app/**', 'package.json', 'resolver.js', '--skip-npm']);

    confirmBlueprinted();
  });

  it('should not create .git folder', async function () {
    await ember(['init', '--skip-npm']);

    expect(dir('.git')).to.not.exist;
  });

  it('calls lint fix function', async function () {
    let lintFixStub = td.replace(lintFix, 'run');

    await ember(['init', '--skip-npm', '--lint-fix']);

    td.verify(lintFixStub(), { ignoreExtraArgs: true, times: 1 });

    confirmBlueprinted();
  });

  it('no CI provider', async function () {
    await ember(['init', '--ci-provider=none', '--skip-install', '--skip-git']);

    expect(file('.github/workflows/ci.yml')).to.not.exist;
    expect(file('config/ember-cli-update.json')).to.include('--ci-provider=none');
  });
});
