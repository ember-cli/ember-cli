'use strict';

var ember = require('../helpers/ember');
var assert = require('assert');
var walkSync = require('../../lib/utilities/walk-sync').walkSync;
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
