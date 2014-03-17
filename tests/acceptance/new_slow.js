'use strict';

var fs = require('fs-extra');
//var RSVP = require('rsvp');
var mkdirSync = fs.mkdirSync;
var rimraf = require('rimraf');
var ember = require('../helpers/ember');
var assert = require('assert');
var walkSync = require('../../lib/utilities/walk-sync').walkSync;
var path = require('path');

describe('Acceptance: ember new', function(){
  var root;
  beforeEach(function(){
    root = process.cwd();
    mkdirSync('tmp');
    process.chdir('./tmp');
  });

  afterEach(function(){
    process.chdir(root);
    rimraf.sync('tmp/foo');
  });

  it('ember new foo, where foo does not yet exist, works', function() {
    this.timeout(1200000);

    return ember(['new', 'foo']).then(function() {
      var cwd = process.cwd().split('/');
      var folder = cwd[cwd.length-1];

      assert.equal(folder, 'foo');

      var skeletonPath = path.join(root, 'skeleton');

      function installables(path) {
        return !/node_modules|vendor|tmp/.test(path);
      }

      var expected = walkSync(skeletonPath).sort().filter(installables);
      var actual = walkSync('.').sort().filter(installables);

      assert.deepEqual(expected, actual, 'correct files');
    });
  });
});
