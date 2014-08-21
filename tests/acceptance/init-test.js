'use strict';

var ember     = require('../helpers/ember');
var assert    = require('assert');
var forEach   = require('lodash-node/compat/collections/forEach');
var walkSync  = require('walk-sync');
var Blueprint = require('../../lib/models/blueprint');
var path      = require('path');
var tmp       = require('../helpers/tmp');
var root      = process.cwd();
var util      = require('util');
var conf      = require('../helpers/conf');
var minimatch = require('minimatch');
var remove    = require('lodash-node/compat/arrays/remove');
var any       = require('lodash-node/compat/collections/some');
var EOL       = require('os').EOL;

var defaultIgnoredFiles = Blueprint.ignoredFiles;

describe('Acceptance: ember init', function() {
  before(function() {
    conf.setup();
  });

  after(function() {
    conf.restore();
  });

  beforeEach(function() {
    tmp.setup('./tmp');
    process.chdir('./tmp');
    Blueprint.ignoredFiles = defaultIgnoredFiles;
  });

  afterEach(function() {
    this.timeout(10000);

    tmp.teardown('./tmp');
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

    expected.sort();

    assert.deepEqual(expected, actual, EOL + ' expected: ' +  util.inspect(expected) +
                     EOL + ' but got: ' +  util.inspect(actual));
  }

  function removeIgnored(array) {
    remove(array, function(fn) {
      return any(Blueprint.ignoredFiles, function(ignoredFile) {
        return minimatch(fn, ignoredFile, { matchBase: true });
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

  it('ember init can run in created folder', function() {
    tmp.setup('./tmp/foo');
    process.chdir('./tmp/foo');

    return ember([
      'init',
      '--skip-npm',
      '--skip-bower'
    ]).then(confirmBlueprinted).then(function() {
      tmp.teardown('./tmp/foo');
    });
  });

  it('init an already init\'d folder', function() {
    return ember([
      'init',
      '--skip-npm',
      '--skip-bower'
    ]).then(function() {
      return ember([
        'init',
        '--skip-npm',
        '--skip-bower'
      ]).then(confirmBlueprinted);
    });
  });
});
