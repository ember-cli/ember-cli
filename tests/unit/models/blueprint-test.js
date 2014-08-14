'use strict';

var Blueprint         = require('../../../lib/models/blueprint');
var MockProject       = require('../../helpers/mock-project');
var MockUI            = require('../../helpers/mock-ui');
var assert            = require('assert');
var glob              = require('glob');
var path              = require('path');
var walkSync          = require('walk-sync');
var rimraf            = require('rimraf');
var root              = process.cwd();
var tmp               = require('tmp-sync');
var tmproot           = path.join(root, 'tmp');
var SilentError       = require('../../../lib/errors/silent');

var defaultBlueprints = path.resolve(__dirname, '..', '..', '..', 'blueprints');
var fixtureBlueprints = path.resolve(__dirname, '..', '..', 'fixtures', 'blueprints');
var basicBlueprint    = path.join(fixtureBlueprints, 'basic');
var basicNewBlueprint = path.join(fixtureBlueprints, 'basic_2');

var defaultIgnoredFiles = Blueprint.ignoredFiles;

var basicBlueprintFiles = [
  '.ember-cli',
  '.gitignore',
  'foo.txt',
  'test.txt'
];

assert.match = function(actual, matcher) {
  assert(matcher.test(actual), 'expected: ' +
                                actual +
                                ' to match ' +
                                matcher);
};

describe('Blueprint', function() {
  beforeEach(function() {
    Blueprint.ignoredFiles = defaultIgnoredFiles;
  });

  describe('.mapFile', function() {
    it('replaces all occurences of __name__ with module name',function(){
      var path = Blueprint.prototype.mapFile('__name__/__name__-controller.js',{dasherizedModuleName: 'my-blueprint'});
      assert.equal(path,'my-blueprint/my-blueprint-controller.js');

      path = Blueprint.prototype.mapFile('__name__/controller.js',{dasherizedModuleName: 'my-blueprint'});
      assert.equal(path,'my-blueprint/controller.js');

      path = Blueprint.prototype.mapFile('__name__/__name__.js',{dasherizedModuleName: 'my-blueprint'});
      assert.equal(path,'my-blueprint/my-blueprint.js');
    });
  });
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

    it('can instantiate a blueprint that exports an object instead of a constructor', function() {
      var blueprint = Blueprint.lookup('exporting-object', {
        paths: [fixtureBlueprints]
      });

      assert.equal(blueprint.woot, 'someValueHere');
      assert(blueprint instanceof Blueprint);
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

      assert.deepEqual(Blueprint.list({ paths: [fixtureBlueprints] }), [{
        source: 'fixtures',
        blueprints: expectedFixtures
      }, {
        source: 'ember-cli',
        blueprints: expectedDefaults
      }]);
    });
  });

  it('exists', function() {
    var blueprint = new Blueprint(basicBlueprint);
    assert(blueprint);
  });

  it('derives name from path', function() {
    var blueprint = new Blueprint(basicBlueprint);
    assert.equal(blueprint.name, 'basic');
  });

  describe('basic blueprint installation', function() {
    var blueprint;
    var ui;
    var project;
    var options;
    var tmpdir;

    beforeEach(function() {
      tmpdir    = tmp.in(tmproot);
      blueprint = new Blueprint(basicBlueprint);
      ui        = new MockUI();
      project   = new MockProject();
      options   = {
        ui: ui,
        project: project,
        target: tmpdir
      };
    });

    afterEach(function() {
      rimraf.sync(tmproot);
    });

    it('installs basic files', function() {
      assert(blueprint);

      return blueprint.install(options)
        .then(function() {
          var actualFiles = walkSync(tmpdir).sort();
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
      return blueprint.install(options)
        .then(function() {
          var output = ui.output.trim().split('\n');
          ui.output = '';

          assert.match(output.shift(), /^installing/);
          assert.match(output.shift(), /create.* \.ember-cli/);
          assert.match(output.shift(), /create.* \.gitignore/);
          assert.match(output.shift(), /create.* foo.txt/);
          assert.match(output.shift(), /create.* test.txt/);
          assert.equal(output.length, 0);

          return blueprint.install(options);
        })
        .then(function() {
          var actualFiles = walkSync(tmpdir).sort();
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
      return blueprint.install(options)
        .then(function() {
          var output = ui.output.trim().split('\n');
          ui.output = '';

          assert.match(output.shift(), /^installing/);
          assert.match(output.shift(), /create.* \.ember-cli/);
          assert.match(output.shift(), /create.* \.gitignore/);
          assert.match(output.shift(), /create.* foo.txt/);
          assert.match(output.shift(), /create.* test.txt/);
          assert.equal(output.length, 0);

          var blueprintNew = new Blueprint(basicNewBlueprint);

          setTimeout(function(){
            ui.inputStream.write('n\n');
          }, 25);

          setTimeout(function(){
            ui.inputStream.write('y\n');
          }, 50);

          return blueprintNew.install(options);
        })
        .then(function() {
          var actualFiles = walkSync(tmpdir).sort();
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

    describe('called on an existing project', function() {
      beforeEach(function() {
        Blueprint.ignoredUpdateFiles.push('foo.txt');
      });

      it('ignores files in ignoredUpdateFiles', function() {
        return blueprint.install(options)
          .then(function() {
            var output = ui.output.trim().split('\n');
            ui.output = '';

            assert.match(output.shift(), /^installing/);
            assert.match(output.shift(), /create.* \.ember-cli/);
            assert.match(output.shift(), /create.* \.gitignore/);
            assert.match(output.shift(), /create.* foo.txt/);
            assert.match(output.shift(), /create.* test.txt/);
            assert.equal(output.length, 0);

            var blueprintNew = new Blueprint(basicNewBlueprint);

            setTimeout(function(){
              ui.inputStream.write('n\n');
            }, 25);

            setTimeout(function(){
              ui.inputStream.write('n\n');
            }, 50);

            options.project.isEmberCLIProject = function() { return true; };

            return blueprintNew.install(options);
          })
          .then(function() {
            var actualFiles = walkSync(tmpdir).sort();
            var output = ui.output.trim().split('\n');
            assert.match(output.shift(), /^installing/);
            assert.match(output.shift(), /Overwrite.*test.*\?/); // Prompt
            assert.match(output.shift(), /Overwrite.*test.*No, skip/);
            assert.match(output.shift(), /identical.* \.ember-cli/);
            assert.match(output.shift(), /identical.* \.gitignore/);
            assert.match(output.shift(), /skip.* test.txt/);
            assert.equal(output.length, 0);

            assert.deepEqual(actualFiles, basicBlueprintFiles);
          });
      });
    });

    it('throws error when there is a trailing forward slash in entityName', function(){
      options.entity = { name: 'foo/' };
      assert.throws(function(){
        blueprint.install(options);
      }, /You specified "foo\/", but you can't use a trailing slash as an entity name with generators. Please re-run the command with "foo"./);

      options.entity = { name: 'foo\\' };
      assert.throws(function(){
        blueprint.install(options);
      }, /You specified "foo\\", but you can't use a trailing slash as an entity name with generators. Please re-run the command with "foo"./);

      options.entity = { name: 'foo' };
      assert.doesNotThrow(function(){
        blueprint.install(options);
      });
    });

    it('throws error when an entityName is not provided', function(){
      options.entity = { };
      assert.throws(function(){
        blueprint.install(options);
      }, SilentError, /'The `ember generate` command requires an entity name to be specified./);
    });


    it('calls normalizeEntityName hook during install', function(done){
      blueprint.normalizeEntityName = function(){ done(); };
      options.entity = { name: 'foo' };
      blueprint.install(options);
    });

    it('normalizeEntityName hook can modify the entity name', function(){
      blueprint.normalizeEntityName = function(){ return 'foo'; };
      options.entity = { name: 'bar' };

      return blueprint.install(options)
          .then(function() {
            var actualFiles = walkSync(tmpdir).sort();

            assert.deepEqual(actualFiles, basicBlueprintFiles);
          });
    });
  });

  describe('addPackageToProject', function() {
    var blueprint;
    var ui;
    var tmpdir;

    beforeEach(function() {
      tmpdir    = tmp.in(tmproot);
      blueprint = new Blueprint(basicBlueprint);
      ui        = new MockUI();
    });

    afterEach(function() {
      rimraf.sync(tmproot);
    });

    it('calls _exec with the proper command when no version is supplied', function() {
      blueprint._exec = function(command) {
        assert.equal(command, 'npm install --save-dev foo-bar');
      };

      blueprint.addPackageToProject('foo-bar');
    });

    it('calls _exec with the proper command when a version is supplied', function() {
      blueprint._exec = function(command) {
        assert.equal(command, 'npm install --save-dev foo-bar@^123.1.12');
      };

      blueprint.addPackageToProject('foo-bar', '^123.1.12');
    });

    it('writes information to the ui log', function() {
      blueprint._exec = function() { };
      blueprint.ui = ui;

      blueprint.addPackageToProject('foo-bar', '^123.1.12');

      var output = ui.output.trim();

      assert.match(output, /install package.*foo-bar/);
    });

    it('does not error if ui is not present', function() {
      blueprint._exec = function() { };
      delete blueprint.ui;

      blueprint.addPackageToProject('foo-bar', '^123.1.12');

      var output = ui.output.trim();

      assert(!output.match(/install package.*foo-bar/));
    });
  });
});
