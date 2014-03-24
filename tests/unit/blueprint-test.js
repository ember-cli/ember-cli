'use strict';

var path = require('path');
var assert = require('assert');
var Blueprint = require('../../lib/blueprint');
var basicBlueprint = path.resolve(path.join(__dirname, '..', 'fixtures', 'blueprints', 'basic'));
var basicNewBlueprint = path.resolve(path.join(__dirname, '..', 'fixtures', 'blueprints', 'basic_2'));
var missingBlueprint = path.resolve(path.join(__dirname, '..', 'fixtures', 'blueprints', '__missing__'));

var tmp = require('../helpers/tmp');
var walkSync = require('../../lib/utilities/walk-sync').walkSync;
var MockUi = require('../helpers/mock-ui');

require('../../lib/ext/promise');

var conf = require('../helpers/conf');

var basicBlueprintFiles = [
  'test.txt',
  'foo.txt'
].sort();

var ui;

assert.match = function(actual, matcher) {
  assert(matcher.test(actual), 'expected: ' +
                                actual +
                                ' to match ' +
                                matcher);
};

function write(message) {
  process.stdin.write(message);
  process.stdin.emit('data', '');
}

describe('Blueprint', function() {
  // TODO: why do I need to do this in a UNIT test?
  before(conf.setup);

  after(conf.restore);

  it('exists', function() {
    assert(Blueprint);
    var blueprint = new Blueprint(basicBlueprint);
    assert(blueprint);
  });

  it('throws when givin unknown blueprintPath', function() {
    assert.throws(function(){
      new Blueprint(missingBlueprint);
    }, /Unknown Blueprint:\s/);
  });

  describe('basic blueprint installation', function() {
    var blueprint;

    beforeEach(function() {
      tmp.setup('./tmp');
      process.chdir('./tmp');
      ui = new MockUi();
      blueprint = new Blueprint(basicBlueprint, ui);
    });

    afterEach(function() {
      tmp.teardown('./tmp');
    });

    it('installs basic files', function() {
      assert(blueprint);
      return blueprint.install('.').then(function(status) {
        var actualFiles = walkSync('.').sort();
        var output = ui.output;

        assert.equal(status, 0);
        assert.match(output.shift(), /^installing/);
        assert.match(output.shift(), /create.* foo.txt/);
        assert.match(output.shift(), /create.* test.txt/);
        assert.equal(output.length, 0);

        assert.deepEqual(actualFiles, basicBlueprintFiles);
      });
    });

    it('re-installing identical files', function() {
      return blueprint.install('.').then(function() {
        var output = ui.output;

        assert.match(output.shift(), /^installing/);
        assert.match(output.shift(), /create.* foo.txt/);
        assert.match(output.shift(), /create.* test.txt/);
        assert.equal(output.length, 0);

        return blueprint.install('.').then(function() {
          var actualFiles = walkSync('.').sort();

          assert.match(output.shift(), /^installing/);
          assert.match(output.shift(), /identical.* foo.txt/);
          assert.match(output.shift(), /identical.* test.txt/);
          assert.equal(output.length, 0);

          assert.deepEqual(actualFiles, basicBlueprintFiles);
        });
      });
    });

    it('re-installing conflicting files', function() {
      return blueprint.install('.').then(function() {
        var output = ui.output;

        assert.match(output.shift(), /^installing/);
        assert.match(output.shift(), /create.* foo.txt/);
        assert.match(output.shift(), /create.* test.txt/);
        assert.equal(output.length, 0);

        var blueprintNew = new Blueprint(basicNewBlueprint, ui);

        setTimeout(function(){
          write('y\n');
        }, 10);

        return blueprintNew.install('.').then(function() {
          var actualFiles = walkSync('.').sort();

          assert.match(output.shift(), /^installing/);
          assert.match(output.shift(), /skip.* foo.txt/);
          assert.match(output.shift(), /identical.* test.txt/);
          assert.equal(output.length, 0);

          assert.deepEqual(actualFiles, basicBlueprintFiles);
        });
      });
    });
  });
});
