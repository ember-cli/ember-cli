'use strict';

let ember = require('../helpers/ember');
let walkSync = require('walk-sync');
let glob = require('glob');
let Blueprint = require('../../lib/models/blueprint');
let path = require('path');
let tmp = require('ember-cli-internal-test-helpers/lib/helpers/tmp');
let root = process.cwd();
let util = require('util');
let minimatch = require('minimatch');
let lodash = require('ember-cli-lodash-subset');
let intersect = lodash.intersection;
let remove = lodash.remove;
let forEach = lodash.forEach;
let any = lodash.some;
let EOL = require('os').EOL;

let chai = require('../chai');
let expect = chai.expect;
let dir = chai.dir;

let defaultIgnoredFiles = Blueprint.ignoredFiles;

let tmpPath = './tmp/init-test';

describe('Acceptance: ember init', function() {
  this.timeout(20000);

  beforeEach(function() {
    Blueprint.ignoredFiles = defaultIgnoredFiles;

    return tmp.setup(tmpPath)
      .then(function() {
        process.chdir(tmpPath);
      });
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

    expect(expected)
      .to.deep.equal(actual, `${EOL} expected: ${util.inspect(expected)}${EOL} but got: ${util.inspect(actual)}`);
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

    expect(expected)
      .to.deep.equal(actual, `${EOL} expected: ${util.inspect(expected)}${EOL} but got: ${util.inspect(actual)}`);
  }

  function pickSync(filePath, pattern) {
    return glob.sync(path.join('**', pattern), {
      cwd: filePath,
      dot: true,
      mark: true,
      strict: true,
    }).sort();
  }

  function removeTmp(array) {
    remove(array, function(entry) {
      return (/^tmp[\\\/]$/).test(entry);
    });
  }
  function removeIgnored(array) {
    remove(array, function(fn) {
      return any(Blueprint.ignoredFiles, function(ignoredFile) {
        return minimatch(fn, ignoredFile, {
          matchBase: true,
        });
      });
    });
  }

  it('ember init', function() {
    return ember([
      'init',
      '--skip-npm',
      '--skip-bower',
    ]).then(confirmBlueprinted);
  });

  it('init an already init\'d folder', function() {
    return ember([
      'init',
      '--skip-npm',
      '--skip-bower',
    ])
    .then(function() {
      return ember([
        'init',
        '--skip-npm',
        '--skip-bower',
      ]);
    })
    .then(confirmBlueprinted);
  });

  it('init a single file', function() {
    return ember([
      'init',
      'app.js',
      '--skip-npm',
      '--skip-bower',
    ])
    .then(function() { return 'app.js'; })
    .then(confirmGlobBlueprinted);
  });

  it('init a single file on already init\'d folder', function() {
    return ember([
      'init',
      '--skip-npm',
      '--skip-bower',
    ])
    .then(function() {
      return ember([
        'init',
        'app.js',
        '--skip-npm',
        '--skip-bower',
      ]);
    })
    .then(confirmBlueprinted);
  });

  it('init multiple files by glob pattern', function() {
    return ember([
      'init',
      'app/**',
      '--skip-npm',
      '--skip-bower',
    ])
    .then(function() { return 'app/**'; })
    .then(confirmGlobBlueprinted);
  });

  it('init multiple files by glob pattern on already init\'d folder', function() {
    return ember([
      'init',
      '--skip-npm',
      '--skip-bower',
    ])
    .then(function() {
      return ember([
        'init',
        'app/**',
        '--skip-npm',
        '--skip-bower',
      ]);
    })
    .then(confirmBlueprinted);
  });

  it('init multiple files by glob patterns', function() {
    return ember([
      'init',
      'app/**',
      '{package,bower}.json',
      'resolver.js',
      '--skip-npm',
      '--skip-bower',
    ])
    .then(function() { return '{app/**,{package,bower}.json,resolver.js}'; })
    .then(confirmGlobBlueprinted);
  });

  it('init multiple files by glob patterns on already init\'d folder', function() {
    return ember([
      'init',
      '--skip-npm',
      '--skip-bower',
    ])
    .then(function() {
      return ember([
        'init',
        'app/**',
        '{package,bower}.json',
        'resolver.js',
        '--skip-npm',
        '--skip-bower',
      ]);
    })
    .then(confirmBlueprinted);
  });

  it('should not create .git folder', function() {
    return ember([
      'init',
      '--skip-npm',
      '--skip-bower',
    ])
    .then(function() {
      expect(dir('.git')).to.not.exist;
    });
  });

});
