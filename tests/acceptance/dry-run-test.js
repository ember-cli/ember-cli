'use strict';

var ember     = require('../helpers/ember');
var assert    = require('assert');
var forEach   = require('lodash-node/compat/collections/forEach');
var walkSync  = require('walk-sync');
var Blueprint = require('../../lib/blueprint');
var path      = require('path');
var tmp       = require('../helpers/tmp');
var root      = process.cwd();
var util      = require('util');
var conf      = require('../helpers/conf');
var fs        = require('fs');

describe('Acceptance: ember --dry-run', function() {
  before(function() {
    conf.setup();
  });

  after(function() {
    conf.restore();
  });

  beforeEach(function() {
    tmp.setup('./tmp');
    process.chdir('./tmp');
  });

  afterEach(function() {
    tmp.teardown('./tmp');
  });

  function confirmBlueprinted() {
    var blueprintPath = path.join(root, 'blueprint');
    var expected      = walkSync(blueprintPath).sort();
    var actual        = walkSync('.').sort();

    forEach(Blueprint.renamedFiles, function(destFile, srcFile) {
      expected[expected.indexOf(srcFile)] = destFile;
    });

    expected.sort();

    assert.deepEqual(expected, actual, '\n expected: ' +  util.inspect(expected) +
                     '\n but got: ' +  util.inspect(actual));
  }

  function confirmNotBlueprinted() {
    var blueprintPath = path.join(root, 'blueprint');
    var expected      = walkSync(blueprintPath).sort();
    var actual        = walkSync('.').sort();

    assert.deepEqual([], actual, '\n expected: ' +  util.inspect(expected) +
                     '\n but got: ' +  util.inspect(actual));
  }

  it('new does not create project folder.', function() {
    return ember([
      'new',
      'foo',
      '--dry-run'
    ]).then(function() {
      assert.ok(!fs.existsSync('./foo'), 'foo folder should not be created.');
    });
  });


  it('new does not create Blueprint.', function() {
    return ember([
      'new',
      'foo',
      '--dry-run'
    ]).then(confirmNotBlueprinted);
  });

  it('new on an already init\'d folder does not change folder.', function() {
    return ember([
      'new',
      'foo',
      '--init'
    ]).then(function() {
      return ember([
        'new',
        'foo',
        '--dry-run'
      ]).then(confirmBlueprinted);
    });
  });

  it('init --dry-run does not create Blueprint', function() {
    tmp.setup('./tmp/foo');
    process.chdir('./tmp/foo');

    return ember([
      'init',
      '--dry-run'
    ]).then(confirmNotBlueprinted).then(function() {
      tmp.teardown('./tmp/foo');
    });
  });

});
