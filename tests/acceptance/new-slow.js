'use strict';

var fs = require('fs-extra');
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
    try {
      mkdirSync('tmp');
    } catch(e) {}
    process.chdir('./tmp');
  });

  afterEach(function(){
    process.chdir(root);
    rimraf.sync('tmp/foo');
  });

  it('ember new foo, where foo does not yet exist, works', function() {
    this.timeout(1200000);

    return ember(['new', 'foo']).then(function() {
      var folder = path.basename(process.cwd());

      assert.equal(folder, 'foo');

      var blueprintPath = path.join(root, 'blueprint');

      function installables(path) {
        return !/node_modules|vendor|tmp/.test(path);
      }

      var expected = walkSync(blueprintPath).sort().filter(installables);
      var actual = walkSync('.').sort().filter(installables);

      assert.deepEqual(expected, actual, 'correct files');
    });
  });

  it('ember new with empty app name doesnt throw exception', function() {
    return ember(['new', '']);
  });

  it('ember new without app name doesnt throw exception', function() {
    return ember(['new']);
  });

});
