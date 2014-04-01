'use strict';

var ember = require('../helpers/ember');
var assert = require('assert');
var forEach = require('lodash-node/compat/collections/forEach');
var walkSync = require('walk-sync');
var Blueprint = require('../../lib/blueprint');
var path = require('path');
var tmp = require('../helpers/tmp');
var root = process.cwd();
var util = require('util');
var conf = require('../helpers/conf');

describe('Acceptance: ember init', function(){

  before(function() {
    conf.setup();
  });

  after(function() {
    conf.restore();
  });

  beforeEach(function(){
    tmp.setup('./tmp');
    process.chdir('./tmp');
  });

  afterEach(function(){
    tmp.teardown('./tmp');
  });

  function confirmBlueprinted() {
    var blueprintPath = path.join(root, 'blueprint');

    var expected = walkSync(blueprintPath).sort();
    var actual = walkSync('.').sort();

    forEach(Blueprint.renamedFiles, function(destFile, srcFile) {
      expected[expected.indexOf(srcFile)] = destFile;
    });

    expected.sort();

    assert.deepEqual(expected, actual, '\n expected: ' +  util.inspect(expected) +
                     '\n but got: ' +  util.inspect(actual));
  }

  it('ember init,', function() {
    return ember([
      'init',
      '--skip-npm-install'
    ]).then(confirmBlueprinted);
  });

  it('init an already init\'d folder', function() {
    return ember([
      'init',
      '--skip-npm-install'
    ]).then(function() {
      return ember([
        'init',
        '--skip-npm-install'
      ]).then(confirmBlueprinted);
    });
  });
});
