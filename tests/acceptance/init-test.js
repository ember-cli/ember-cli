'use strict';

var ember      = require('../helpers/ember');
var walkSync   = require('walk-sync');
var glob       = require('glob');
var Blueprint  = require('../../lib/models/blueprint');
var path       = require('path');
var tmp        = require('ember-cli-internal-test-helpers/lib/helpers/tmp');
var root       = process.cwd();
var util       = require('util');
var conf       = require('ember-cli-internal-test-helpers/lib/helpers/conf');
var minimatch  = require('minimatch');
var lodash = require('ember-cli-lodash-subset');
var intersect  = lodash.intersection;
var remove     = lodash.remove;
var forEach    = lodash.forEach;
var any        = lodash.some;
var EOL        = require('os').EOL;

var chai = require('../chai');
var expect = chai.expect;
var dir = chai.dir;

var defaultIgnoredFiles = Blueprint.ignoredFiles;

var tmpPath = './tmp/init-test';

describe('Acceptance: ember init', function() {
  this.timeout(20000);

  before(function() {
    conf.setup();
  });

  after(function() {
    conf.restore();
  });

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
    var blueprintPath = path.join(root, 'blueprints', 'app', 'files');
    var expected      = walkSync(blueprintPath).sort();
    var actual        = walkSync('.').sort();

    forEach(Blueprint.renamedFiles, function(destFile, srcFile) {
      expected[expected.indexOf(srcFile)] = destFile;
    });

    removeIgnored(expected);
    removeIgnored(actual);

    removeTmp(expected);
    removeTmp(actual);

    expected.sort();

    expect(expected).to.deep.equal(actual, EOL + ' expected: ' +  util.inspect(expected) +
                                           EOL + ' but got: ' +  util.inspect(actual));
  }

  function confirmGlobBlueprinted(pattern) {
    var blueprintPath = path.join(root, 'blueprints', 'app', 'files');
    var actual        = pickSync('.', pattern);
    var expected      = intersect(actual, pickSync(blueprintPath, pattern));

    removeIgnored(expected);
    removeIgnored(actual);

    removeTmp(expected);
    removeTmp(actual);

    expected.sort();

    expect(expected).to.deep.equal(actual, EOL + ' expected: ' +  util.inspect(expected) +
                                           EOL + ' but got: ' +  util.inspect(actual));
  }

  function pickSync(filePath, pattern) {
    return glob.sync(path.join('**', pattern), {
      cwd: filePath,
      dot: true,
      mark: true,
      strict: true
    }).sort();
  }

  function removeTmp(array) {
    remove(array, function(entry) {
      return /^tmp[\\\/]$/.test(entry);
    });
  }
  function removeIgnored(array) {
    remove(array, function(fn) {
      return any(Blueprint.ignoredFiles, function(ignoredFile) {
        return minimatch(fn, ignoredFile, {
          matchBase: true
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
      '--skip-bower'
    ])
    .then(function() {
      return ember([
        'init',
        '--skip-npm',
        '--skip-bower'
      ]);
    })
    .then(confirmBlueprinted);
  });

  it('init a single file', function() {
    return ember([
      'init',
      'app.js',
      '--skip-npm',
      '--skip-bower'
    ])
    .then(function() { return 'app.js'; })
    .then(confirmGlobBlueprinted);
  });

  it('init a single file on already init\'d folder', function() {
    return ember([
      'init',
      '--skip-npm',
      '--skip-bower'
    ])
    .then(function() {
      return ember([
        'init',
        'app.js',
        '--skip-npm',
        '--skip-bower'
      ]);
    })
    .then(confirmBlueprinted);
  });

  it('init multiple files by glob pattern', function() {
    return ember([
      'init',
      'app/**',
      '--skip-npm',
      '--skip-bower'
    ])
    .then(function() { return 'app/**'; })
    .then(confirmGlobBlueprinted);
  });

  it('init multiple files by glob pattern on already init\'d folder', function() {
    return ember([
      'init',
      '--skip-npm',
      '--skip-bower'
    ])
    .then(function() {
      return ember([
        'init',
        'app/**',
        '--skip-npm',
        '--skip-bower'
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
      '--skip-bower'
    ])
    .then(function() { return '{app/**,{package,bower}.json,resolver.js}'; })
    .then(confirmGlobBlueprinted);
  });

  it('init multiple files by glob patterns on already init\'d folder', function() {
    return ember([
      'init',
      '--skip-npm',
      '--skip-bower'
    ])
    .then(function() {
      return ember([
        'init',
        'app/**',
        '{package,bower}.json',
        'resolver.js',
        '--skip-npm',
        '--skip-bower'
      ]);
    })
    .then(confirmBlueprinted);
  });

  it('should not create .git folder', function() {
    return ember([
      'init',
      '--skip-npm',
      '--skip-bower'
    ])
    .then(function() {
      expect(dir('.git')).to.not.exist;
    });
  });

});
