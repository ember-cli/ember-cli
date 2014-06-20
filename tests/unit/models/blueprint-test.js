'use strict';

var Blueprint         = require('../../../lib/models/blueprint');
var MockProject       = require('../../helpers/mock-project');
var MockUI            = require('../../helpers/mock-ui');
var assert            = require('assert');
var glob              = require('glob');
var path              = require('path');
var tmp               = require('../../helpers/tmp');
var walkSync          = require('walk-sync');

var defaultBlueprints = path.resolve(__dirname, '..', '..', '..', 'blueprints');
var fixtureBlueprints = path.resolve(__dirname, '..', '..', 'fixtures', 'blueprints');
var basicBlueprint    = path.join(fixtureBlueprints, 'basic');
var basicNewBlueprint = path.join(fixtureBlueprints, 'basic_2');

var basicBlueprintFiles = [
  '.ember-cli',
  '.gitignore',
  'foo.txt',
  'test.txt'
];

var ui;
var project;

assert.match = function(actual, matcher) {
  assert(matcher.test(actual), 'expected: ' +
                                actual +
                                ' to match ' +
                                matcher);
};

describe('Blueprint', function() {

  describe('.lookup', function() {
    it('uses an explicit path if one is given', function() {
      var expectedClass = require(basicBlueprint);
      var blueprint = Blueprint.lookup(basicBlueprint);

      assert.equal(blueprint.name, 'basic');
      assert.equal(blueprint.path, basicBlueprint);
      assert(blueprint instanceof expectedClass);
    });

    it('finds blueprints within given lookup paths', function() {
      var expectedClass = require(basicBlueprint);
      var blueprint = Blueprint.lookup('basic', {
        paths: [fixtureBlueprints]
      });

      assert.equal(blueprint.name, 'basic');
      assert.equal(blueprint.path, basicBlueprint);
      assert(blueprint instanceof expectedClass);
    });

    it('finds blueprints in the ember-cli package', function() {
      var expectedPath = path.resolve(defaultBlueprints, 'app');
      var expectedClass = require('../../../blueprints/app');

      var blueprint = Blueprint.lookup('app');

      assert.equal(blueprint.name, 'app');
      assert.equal(blueprint.path, expectedPath);
      assert(blueprint instanceof expectedClass);
    });

    it('throws an error if no blueprint is found', function() {
      assert.throws(function() {
        Blueprint.lookup('foo');
      }, 'Unknown blueprint: foo');
    });
  });

  describe('.list', function() {
    it('returns a list of blueprints grouped by lookup path', function() {
      var expectedDefaults = glob.sync(path.join(defaultBlueprints, '*'));
      expectedDefaults = expectedDefaults.map(function(blueprint) {
        return path.basename(blueprint);
      });
      var expectedFixtures = glob.sync(path.join(fixtureBlueprints, '*'));
      expectedFixtures = expectedFixtures.map(function(blueprint) {
        return path.basename(blueprint);
      });

      assert.deepEqual(Blueprint.list([fixtureBlueprints]), [{
        source: 'fixtures',
        blueprints: expectedFixtures
      }, {
        source: 'ember-cli',
        blueprints: expectedDefaults
      }]);
    });
  });

  it('exists', function() {
    var blueprint = new Blueprint({ path: basicBlueprint });
    assert(blueprint);
  });

  it('derives name from path', function() {
    var blueprint = new Blueprint({ path: basicBlueprint });
    assert.equal(blueprint.name, 'basic');
  });

  describe('basic blueprint installation', function() {
    var blueprint;

    beforeEach(function() {
      tmp.setup('./tmp');
      process.chdir('./tmp');

      ui = new MockUI();
      project = new MockProject();

      blueprint = new Blueprint({
        ui: ui,
        project: project,
        path: basicBlueprint
      });
    });

    afterEach(function() {
      tmp.teardown('./tmp');
    });

    it('installs basic files', function() {
      assert(blueprint);
      return blueprint.install({ target: '.' })
        .then(function() {
          var actualFiles = walkSync('.').sort();
          var output = ui.output.trim().split('\n');

          assert.match(output.shift(), /^installing/);
          assert.match(output.shift(), /create.* .ember-cli/);
          assert.match(output.shift(), /create.* .gitignore/);
          assert.match(output.shift(), /create.* foo.txt/);
          assert.match(output.shift(), /create.* test.txt/);
          assert.equal(output.length, 0);

          assert.deepEqual(actualFiles, basicBlueprintFiles);
        });
    });

    it('re-installing identical files', function() {
      return blueprint.install({ target: '.' })
        .then(function() {
          var output = ui.output.trim().split('\n');
          ui.output = '';

          assert.match(output.shift(), /^installing/);
          assert.match(output.shift(), /create.* \.ember-cli/);
          assert.match(output.shift(), /create.* \.gitignore/);
          assert.match(output.shift(), /create.* foo.txt/);
          assert.match(output.shift(), /create.* test.txt/);
          assert.equal(output.length, 0);

          return blueprint.install({ target: '.' });
        })
        .then(function() {
          var actualFiles = walkSync('.').sort();
          var output = ui.output.trim().split('\n');

          assert.match(output.shift(), /^installing/);
          assert.match(output.shift(), /identical.* \.ember-cli/);
          assert.match(output.shift(), /identical.* \.gitignore/);
          assert.match(output.shift(), /identical.* foo.txt/);
          assert.match(output.shift(), /identical.* test.txt/);
          assert.equal(output.length, 0);

          assert.deepEqual(actualFiles, basicBlueprintFiles);
        });
    });

    it('re-installing conflicting files', function() {
      return blueprint.install({ target: '.' })
        .then(function() {
          var output = ui.output.trim().split('\n');
          ui.output = '';

          assert.match(output.shift(), /^installing/);
          assert.match(output.shift(), /create.* \.ember-cli/);
          assert.match(output.shift(), /create.* \.gitignore/);
          assert.match(output.shift(), /create.* foo.txt/);
          assert.match(output.shift(), /create.* test.txt/);
          assert.equal(output.length, 0);

          var blueprintNew = new Blueprint({
              path: basicNewBlueprint,
              ui: ui,
              project: project
            });

          setTimeout(function(){
            ui.inputStream.write('n\n');
          }, 25);

          setTimeout(function(){
            ui.inputStream.write('y\n');
          }, 50);

          return blueprintNew.install({ target: '.' });
        })
        .then(function() {
          var actualFiles = walkSync('.').sort();
          var output = ui.output.trim().split('\n');
          assert.match(output.shift(), /^installing/);
          assert.match(output.shift(), /Overwrite.*foo.*\?/); // Prompt
          assert.match(output.shift(), /Overwrite.*foo.*No, skip/);
          assert.match(output.shift(), /Overwrite.*test.*\?/); // Prompt
          assert.match(output.shift(), /Overwrite.*test.*Yes, overwrite/);
          assert.match(output.shift(), /identical.* \.ember-cli/);
          assert.match(output.shift(), /identical.* \.gitignore/);
          assert.match(output.shift(), /skip.* foo.txt/);
          assert.match(output.shift(), /overwrite.* test.txt/);
          assert.equal(output.length, 0);

          assert.deepEqual(actualFiles, basicBlueprintFiles);
        });
    });
  });
});
