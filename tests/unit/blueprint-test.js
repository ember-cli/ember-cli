'use strict';

var path              = require('path');
var assert            = require('assert');
var stub              = require('../helpers/stub').stub;
var Blueprint         = require('../../lib/blueprint');

var rootBlueprints    = path.resolve(path.join(__dirname, '..', 'fixtures', 'blueprints'));
var basicBlueprint    = path.join(rootBlueprints, 'basic');
var basicNewBlueprint = path.join(rootBlueprints, 'basic_2');
var missingBlueprint  = path.join(rootBlueprints, '__missing__');

var tmp      = require('../helpers/tmp');
var walkSync = require('walk-sync');
var MockUi   = require('../helpers/mock-ui');

require('../../lib/ext/promise');

var basicBlueprintFiles = [
  '.gitignore',
  'test.txt',
  'foo.txt'
].sort();

var ui;

function stubBlueprint(structure, ui) {
  var blueprint = new Blueprint(structure, ui);
  stub(blueprint, 'postInstall');
  return blueprint;
}

assert.match = function(actual, matcher) {
  assert(matcher.test(actual), 'expected: ' +
                                actual +
                                ' to match ' +
                                matcher);
};

describe('Blueprint', function() {

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
    var postInstall;

    beforeEach(function() {
      tmp.setup('./tmp');
      process.chdir('./tmp');
      ui = new MockUi();
      blueprint = stubBlueprint(basicBlueprint, ui);
      postInstall = stub(blueprint, 'postInstall');
    });

    afterEach(function() {
      tmp.teardown('./tmp');
      postInstall.restore();
    });

    it('installs basic files', function() {
      assert(blueprint);
      return blueprint.install('.').then(function() {
        var actualFiles = walkSync('.').sort();
        var output = ui.output.trim().split('\n');

        assert.match(output.shift(), /^installing/);
        assert.match(output.shift(), /create.* .gitignore/);
        assert.match(output.shift(), /create.* foo.txt/);
        assert.match(output.shift(), /create.* test.txt/);
        assert.equal(output.length, 0);

        assert.deepEqual(actualFiles, basicBlueprintFiles);
      });
    });

    it('re-installing identical files', function() {
      return blueprint.install('.').then(function() {
        var output = ui.output.trim().split('\n');
        ui.output = '';

        assert.match(output.shift(), /^installing/);
        assert.match(output.shift(), /create.* \.gitignore/);
        assert.match(output.shift(), /create.* foo.txt/);
        assert.match(output.shift(), /create.* test.txt/);
        assert.equal(output.length, 0);

        return blueprint.install('.').then(function() {
          var actualFiles = walkSync('.').sort();
          var output = ui.output.trim().split('\n');

          assert.match(output.shift(), /^installing/);
          assert.match(output.shift(), /identical.* \.gitignore/);
          assert.match(output.shift(), /identical.* foo.txt/);
          assert.match(output.shift(), /identical.* test.txt/);
          assert.equal(output.length, 0);

          assert.deepEqual(actualFiles, basicBlueprintFiles);
        });
      });
    });

    it('re-installing conflicting files', function() {
      return blueprint.install('.').then(function() {
        var output = ui.output.trim().split('\n');
        ui.output = '';

        assert.match(output.shift(), /^installing/);
        assert.match(output.shift(), /create.* \.gitignore/);
        assert.match(output.shift(), /create.* foo.txt/);
        assert.match(output.shift(), /create.* test.txt/);
        assert.equal(output.length, 0);

        var blueprintNew = stubBlueprint(basicNewBlueprint, ui);
        stub(blueprintNew, 'postInstall');

        setTimeout(function(){
          ui.inputStream.write('n\n');
        }, 10);

        setTimeout(function(){
          ui.inputStream.write('y\n');
        }, 20);

        return blueprintNew.install('.').then(function() {
          var actualFiles = walkSync('.').sort();
          var output = ui.output.trim().split('\n');
          assert.match(output.shift(), /^installing/);
          assert.match(output.shift(), /Overwrite.*foo.*\?/); // Prompt
          assert.match(output.shift(), /Overwrite.*foo.*No, skip/);
          assert.match(output.shift(), /Overwrite.*test.*\?/); // Prompt
          assert.match(output.shift(), /Overwrite.*test.*Yes, overwrite/);
          assert.match(output.shift(), /identical.* \.gitignore/);
          assert.match(output.shift(), /skip.* foo.txt/);
          assert.match(output.shift(), /overwrite.* test.txt/);
          assert.equal(output.length, 0);

          assert.deepEqual(actualFiles, basicBlueprintFiles);
        });
      });
    });
  });
});
