'use strict';

var fs                = require('fs');
var Blueprint         = require('../../../lib/models/blueprint');
var Task              = require('../../../lib/models/task');
var MockProject       = require('../../helpers/mock-project');
var MockUI            = require('../../helpers/mock-ui');
var assert            = require('assert');
var glob              = require('glob');
var path              = require('path');
var walkSync          = require('walk-sync');
var rimraf            = require('rimraf');
var EOL               = require('os').EOL;
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
          var output = ui.output.trim().split(EOL);

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
          var output = ui.output.trim().split(EOL);
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
          var output = ui.output.trim().split(EOL);

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
          var output = ui.output.trim().split(EOL);
          ui.output = '';

          assert.match(output.shift(), /^installing/);
          assert.match(output.shift(), /create.* \.ember-cli/);
          assert.match(output.shift(), /create.* \.gitignore/);
          assert.match(output.shift(), /create.* foo.txt/);
          assert.match(output.shift(), /create.* test.txt/);
          assert.equal(output.length, 0);

          var blueprintNew = new Blueprint(basicNewBlueprint);

          setTimeout(function(){
            ui.inputStream.write('n' + EOL);
          }, 25);

          setTimeout(function(){
            ui.inputStream.write('y' + EOL);
          }, 50);

          return blueprintNew.install(options);
        })
        .then(function() {
          var actualFiles = walkSync(tmpdir).sort();
          var output = ui.output.trim().split(EOL);
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
            var output = ui.output.trim().split(EOL);
            ui.output = '';

            assert.match(output.shift(), /^installing/);
            assert.match(output.shift(), /create.* \.ember-cli/);
            assert.match(output.shift(), /create.* \.gitignore/);
            assert.match(output.shift(), /create.* foo.txt/);
            assert.match(output.shift(), /create.* test.txt/);
            assert.equal(output.length, 0);

            var blueprintNew = new Blueprint(basicNewBlueprint);

            setTimeout(function(){
              ui.inputStream.write('n' + EOL);
            }, 25);

            setTimeout(function(){
              ui.inputStream.write('n'+ EOL);
            }, 50);

            options.project.isEmberCLIProject = function() { return true; };

            return blueprintNew.install(options);
          })
          .then(function() {
            var actualFiles = walkSync(tmpdir).sort();
            var output = ui.output.trim().split(EOL);
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

    it('calls normalizeEntityName before locals hook is called', function(done) {
      blueprint.normalizeEntityName = function(){ return 'foo'; };
      blueprint.locals = function(options) {
        assert.equal(options.entity.name, 'foo');
        done();
      };
      options.entity = { name: 'bar' };
      blueprint.install(options);
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

  describe('addBowerPackageToProject', function() {
    var blueprint;
    var ui;
    var tmpdir;
    var BowerInstallTask;
    var taskNameLookedUp;

    beforeEach(function() {
      tmpdir    = tmp.in(tmproot);
      blueprint = new Blueprint(basicBlueprint);
      ui        = new MockUI();

      blueprint.taskFor = function(name) {
        taskNameLookedUp = name;

        return new BowerInstallTask();
      };
    });

    afterEach(function() {
      rimraf.sync(tmproot);
    });

    it('looks up the `bower-install` task', function() {
      BowerInstallTask = Task.extend({
        run: function() {}
      });
      blueprint.addBowerPackageToProject('foo-bar');

      assert.equal(taskNameLookedUp, 'bower-install');
    });

    it('calls the task with the package name', function() {
      var packages;

      BowerInstallTask = Task.extend({
        run: function(options) {
          packages = options.packages;
        }
      });

      blueprint.addBowerPackageToProject('foo-bar');

      assert.deepEqual(packages, ['foo-bar']);
    });

    it('uses the provided target (version, range, sha, etc)', function() {
      var packages;

      BowerInstallTask = Task.extend({
        run: function(options) {
          packages = options.packages;
        }
      });

      blueprint.addBowerPackageToProject('foo-bar', '~1.0.0');

      assert.deepEqual(packages, ['foo-bar#~1.0.0']);
    });

    it('uses uses verbose mode with the task', function() {
      var verbose;

      BowerInstallTask = Task.extend({
        run: function(options) {
          verbose = options.verbose;
        }
      });

      blueprint.addBowerPackageToProject('foo-bar', '~1.0.0');

      assert(verbose);
    });
  });

  describe('insertIntoFile', function() {
    var blueprint;
    var ui;
    var tmpdir;
    var project;
    var filename;

    beforeEach(function() {
      tmpdir    = tmp.in(tmproot);
      blueprint = new Blueprint(basicBlueprint);
      ui        = new MockUI();
      project   = new MockProject();

      // normally provided by `install`, but mocked here for testing
      project.root = tmpdir;
      blueprint.project = project;

      filename = 'foo-bar-baz.txt';
    });

    afterEach(function() {
      rimraf.sync(tmproot);
    });

    it('will create the file if not already existing', function() {
      var toInsert = 'blahzorz blammo';

      return blueprint.insertIntoFile(filename, toInsert)
        .then(function(result) {
          var contents = fs.readFileSync(path.join(project.root, filename), { encoding: 'utf8' });

          assert(contents.indexOf(toInsert) > -1, 'contents were inserted');
          assert.equal(result.originalContents, '', 'returned object should contain original contents');
          assert(result.inserted, 'inserted should indicate that the file was modified');
          assert.equal(contents, result.contents, 'returned object should contain contents');
        });
    });

    it('will insert into the file if it already exists', function() {
      var toInsert = 'blahzorz blammo';
      var originalContent = 'some original content\n';
      var filePath = path.join(project.root, filename);

      fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

      return blueprint.insertIntoFile(filename, toInsert)
        .then(function(result) {
          var contents = fs.readFileSync(path.join(project.root, filename), { encoding: 'utf8' });

          assert.equal(contents, originalContent + toInsert, 'inserted contents should be appended to original');
          assert.equal(result.originalContents, originalContent, 'returned object should contain original contents');
          assert(result.inserted, 'inserted should indicate that the file was modified');
        });
    });

    it('will not insert into the file if it already contains the content', function() {
      var toInsert = 'blahzorz blammo';
      var filePath = path.join(project.root, filename);

      fs.writeFileSync(filePath, toInsert, { encoding: 'utf8' });

      return blueprint.insertIntoFile(filename, toInsert)
        .then(function(result) {
          var contents = fs.readFileSync(path.join(project.root, filename), { encoding: 'utf8' });

          assert.equal(contents, toInsert, 'contents should be unchanged');
          assert(!result.inserted, 'inserted should indicate that the file was not modified');
        });
    });

    it('will insert into the file if it already contains the content if force option is passed', function() {
      var toInsert = 'blahzorz blammo';
      var filePath = path.join(project.root, filename);

      fs.writeFileSync(filePath, toInsert, { encoding: 'utf8' });

      return blueprint.insertIntoFile(filename, toInsert, { force: true })
        .then(function(result) {
          var contents = fs.readFileSync(path.join(project.root, filename), { encoding: 'utf8' });

          assert.equal(contents, toInsert + toInsert, 'contents should be unchanged');
          assert(result.inserted, 'inserted should indicate that the file was not modified');
        });
    });
  });
});
