'use strict';

const ember = require('../helpers/ember');
const walkSync = require('walk-sync');
const glob = require('glob');
const Blueprint = require('../../lib/models/blueprint');
const path = require('path');
const tmp = require('ember-cli-internal-test-helpers/lib/helpers/tmp');
let root = process.cwd();
const util = require('util');
const minimatch = require('minimatch');
const lodash = require('ember-cli-lodash-subset');
let intersect = lodash.intersection;
let remove = lodash.remove;
let forEach = lodash.forEach;
const EOL = require('os').EOL;

const chai = require('../chai');
let expect = chai.expect;
let dir = chai.dir;

let defaultIgnoredFiles = Blueprint.ignoredFiles;

let tmpPath = './tmp/init-test';

describe('Acceptance: ember init', function() {
  this.timeout(20000);

  beforeEach(async function() {
    Blueprint.ignoredFiles = defaultIgnoredFiles;

    await tmp.setup(tmpPath);
    process.chdir(tmpPath);
  });

  afterEach(function() {
    return tmp.teardown(tmpPath);
  });

  function confirmBlueprinted() {
    let blueprintPath = path.join(root, 'blueprints', 'app', 'files');
    let expected = walkSync(blueprintPath).sort();
    let actual = walkSync('.').sort();

    forEach(Blueprint.renamedFiles, function(destFile, srcFile) {
      expected[expected.indexOf(srcFile)] = destFile;
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
      .sync(path.join('**', pattern), {
        cwd: filePath,
        dot: true,
        mark: true,
        strict: true,
      })
      .sort();
  }

  function removeTmp(array) {
    remove(array, function(entry) {
      return /^tmp[\\/]$/.test(entry);
    });
  }
  function removeIgnored(array) {
    remove(array, function(fn) {
      return Blueprint.ignoredFiles.some(function(ignoredFile) {
        return minimatch(fn, ignoredFile, {
          matchBase: true,
        });
      });
    });
  }

  it('ember init', async function() {
    await ember(['init', '--skip-npm', '--skip-bower']);

    confirmBlueprinted();
  });

  it("init an already init'd folder", async function() {
    await ember(['init', '--skip-npm', '--skip-bower']);

    await ember(['init', '--skip-npm', '--skip-bower']);

    confirmBlueprinted();
  });

  it('init a single file', async function() {
    await ember(['init', 'app.js', '--skip-npm', '--skip-bower']);

    confirmGlobBlueprinted('app.js');
  });

  it("init a single file on already init'd folder", async function() {
    await ember(['init', '--skip-npm', '--skip-bower']);

    await ember(['init', 'app.js', '--skip-npm', '--skip-bower']);

    confirmBlueprinted();
  });

  it('init multiple files by glob pattern', async function() {
    await ember(['init', 'app/**', '--skip-npm', '--skip-bower']);

    confirmGlobBlueprinted('app/**');
  });

  it("init multiple files by glob pattern on already init'd folder", async function() {
    await ember(['init', '--skip-npm', '--skip-bower']);

    await ember(['init', 'app/**', '--skip-npm', '--skip-bower']);

    confirmBlueprinted();
  });

  it('init multiple files by glob patterns', async function() {
    await ember(['init', 'app/**', '{package,bower}.json', 'resolver.js', '--skip-npm', '--skip-bower']);

    confirmGlobBlueprinted('{app/**,{package,bower}.json,resolver.js}');
  });

  it("init multiple files by glob patterns on already init'd folder", async function() {
    await ember(['init', '--skip-npm', '--skip-bower']);

    await ember(['init', 'app/**', '{package,bower}.json', 'resolver.js', '--skip-npm', '--skip-bower']);

    confirmBlueprinted();
  });

  it('should not create .git folder', async function() {
    await ember(['init', '--skip-npm', '--skip-bower']);

    expect(dir('.git')).to.not.exist;
  });
});
