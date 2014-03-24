'use strict';

var fs = require('fs-extra');
var ember = require('../helpers/ember');
var assert = require('assert');
var walkSync = require('../../lib/utilities/walk-sync').walkSync;
var path = require('path');
var tmp = require('../helpers/tmp');
var root = process.cwd();
var util = require('util');

describe('Acceptance: ember new', function(){
  beforeEach(function(){
    tmp.setup('./tmp');
    process.chdir('./tmp');
  });

  afterEach(function(){
    tmp.teardown('./tmp');
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

      assert.deepEqual(expected, actual, '\n expected: ' +  util.inspect(expected) +
                       '\n but got: ' +  util.inspect(actual));
    });
  });

  it('ember new with empty app name doesnt throw exception', function() {
    return ember(['new', '']);
  });

  it('ember new without app name doesnt throw exception', function() {
    return ember(['new']);
  });

  it('Cannot run ember new, inside of ember-cli project', function() {
    this.timeout(1200000);
    return ember(['new', 'foo']).then(function() {
      return ember(['new', 'foo']).then(function() {
        assert(!fs.existsSync('foo'));
      });
    });
  });
});
