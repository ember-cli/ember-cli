'use strict';

var fs                = require('fs');
var Blueprint         = require('../../../lib/models/blueprint');
var Task              = require('../../../lib/models/task');
var MockProject       = require('../../helpers/mock-project');
var MockUI            = require('../../helpers/mock-ui');
var assert            = require('assert');
var path              = require('path');
var glob              = require('glob');
var walkSync          = require('walk-sync');
var Promise           = require('../../../lib/ext/promise');
var rimraf            = Promise.denodeify(require('rimraf'));
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
    it('accepts locals.fileMap with multiple mappings',function(){
      var locals = {};
      locals.fileMap= {
        __name__: 'user',
        __type__: 'controller',
        __path__: 'pods/users',
        __plural__: ''
      };

      var path = Blueprint.prototype.mapFile('__name__/__type____plural__.js',locals);
      assert.equal(path,'user/controller.js');

      path = Blueprint.prototype.mapFile('__path__/__name__/__type__.js',locals);
      assert.equal(path,'pods/users/user/controller.js');
    });
  });
  describe('.fileMapTokens', function() {
    it('adds additional tokens from fileMapTokens hook', function() {
      var blueprint = Blueprint.lookup(basicBlueprint);
      blueprint.fileMapTokens = function() {
        return {
          __foo__: function(){
            return 'foo';
          }
        };
      };
      var tokens = blueprint._fileMapTokens();
      assert.equal(tokens.__foo__(), 'foo');
    });
  });
  describe('.generateFileMap', function() {
    it('should not have locals in the fileMap', function() {
      var blueprint = Blueprint.lookup(basicBlueprint);

      var fileMapVariables = {
        pod: true,
        podPath: 'pods',
        blueprintName: 'test',
        dasherizedModuleName: 'foo-baz',
        locals: { SOME_LOCAL_ARG: 'ARGH' }
      };

      var fileMap = blueprint.generateFileMap(fileMapVariables);
      var expected = {
        __name__: 'foo-baz',
        __path__: 'tests',
        __test__: 'foo-baz-test'
      };

      assert.deepEqual( fileMap, expected );
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
      var expectedClass = Blueprint;

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

    it('returns undefined if no blueprint is found and ignoredMissing is passed', function() {
      var blueprint = Blueprint.lookup('foo', {
        ignoreMissing: true
      });

      assert.equal(blueprint, undefined);
    });
  });

  describe('.list', function() {
    it('returns a list of blueprints grouped by lookup path', function() {
      var list = Blueprint.list({ paths: [fixtureBlueprints] });
      var actual = list[0];
      var expected = {
        source: 'fixtures',
        blueprints: [{
          name: 'basic',
          description: 'A basic blueprint',
          overridden: false
        }, {
          name: 'basic_2',
          description: 'Another basic blueprint',
          overridden: false
        }, {
          name: 'exporting-object',
          description: 'A blueprint that exports an object',
          overridden: false
        }, {
          name: 'with-templating',
          description: 'A blueprint with templating',
          overridden: false
        }]
      };

      assert.deepEqual(actual[0], expected[0]);
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
      return rimraf(tmproot);
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
          // Prompts contain \n EOL
          // Split output on \n since it will have the same affect as spliting on OS specific EOL
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

    it('installs path globPattern file', function() {
      options.targetFiles = ['foo.txt'];
      return blueprint.install(options)
        .then(function() {
          var actualFiles = walkSync(tmpdir).sort();
          var globFiles = glob.sync(path.join('**', 'foo.txt'), {
              cwd: tmpdir,
              dot: true,
              mark: true,
              strict: true
            }).sort();
          var output = ui.output.trim().split(EOL);

          assert.match(output.shift(), /^installing/);
          assert.match(output.shift(), /create.* foo.txt/);
          assert.equal(output.length, 0);

          assert.deepEqual(actualFiles, globFiles);
        });
    });

    it('installs multiple globPattern files', function() {
      options.targetFiles = ['foo.txt','test.txt'];
      return blueprint.install(options)
        .then(function() {
          var actualFiles = walkSync(tmpdir).sort();
          var globFiles = glob.sync(path.join('**', '*.txt'), {
              cwd: tmpdir,
              dot: true,
              mark: true,
              strict: true
            }).sort();
          var output = ui.output.trim().split(EOL);

          assert.match(output.shift(), /^installing/);
          assert.match(output.shift(), /create.* foo.txt/);
          assert.match(output.shift(), /create.* test.txt/);
          assert.equal(output.length, 0);

          assert.deepEqual(actualFiles, globFiles);
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
            // Prompts contain \n EOL
            // Split output on \n since it will have the same affect as spliting on OS specific EOL
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
      return rimraf(tmproot);
    });

    it('passes a packages array for addPackagesToProject', function() {
      blueprint.addPackagesToProject = function(packages) {
        assert.deepEqual(packages, [{name: 'foo-bar'}]);
      };

      blueprint.addPackageToProject('foo-bar');
    });

    it('passes a packages array with target for addPackagesToProject', function() {
      blueprint.addPackagesToProject = function(packages) {
        assert.deepEqual(packages, [{name: 'foo-bar', target: '^123.1.12'}]);
      };

      blueprint.addPackageToProject('foo-bar', '^123.1.12');
    });
  });

  describe('addPackagesToProject', function() {
    var blueprint;
    var ui;
    var tmpdir;
    var NpmInstallTask;
    var taskNameLookedUp;

    beforeEach(function() {
      tmpdir    = tmp.in(tmproot);
      blueprint = new Blueprint(basicBlueprint);
      ui        = new MockUI();

      blueprint.taskFor = function(name) {
        taskNameLookedUp = name;

        return new NpmInstallTask();
      };
    });

    afterEach(function() {
      return rimraf(tmproot);
    });

    it('looks up the `npm-install` task', function() {
      NpmInstallTask = Task.extend({
        run: function() {}
      });

      blueprint.addPackagesToProject([{name: 'foo-bar'}]);

      assert.equal(taskNameLookedUp, 'npm-install');
    });

    it('calls the task with package names', function() {
      var packages;

      NpmInstallTask = Task.extend({
        run: function(options) {
          packages = options.packages;
        }
      });

      blueprint.addPackagesToProject([
        {name: 'foo-bar'},
        {name: 'bar-foo'}
      ]);

      assert.deepEqual(packages, ['foo-bar', 'bar-foo']);
    });

    it('calls the task with package names and versions', function() {
      var packages;

      NpmInstallTask = Task.extend({
        run: function(options) {
          packages = options.packages;
        }
      });

      blueprint.addPackagesToProject([
        {name: 'foo-bar', target: '^123.1.12'},
        {name: 'bar-foo', target: '0.0.7'}
      ]);

      assert.deepEqual(packages, ['foo-bar@^123.1.12', 'bar-foo@0.0.7']);
    });

    it('writes information to the ui log for a single package', function() {
      blueprint._exec = function() { };
      blueprint.ui = ui;

      blueprint.addPackagesToProject([
        {name: 'foo-bar', target: '^123.1.12'}
      ]);

      var output = ui.output.trim();

      assert.match(output, /install package.*foo-bar/);
    });

    it('writes information to the ui log for multiple packages', function() {
      blueprint._exec = function() { };
      blueprint.ui = ui;

      blueprint.addPackagesToProject([
        {name: 'foo-bar', target: '^123.1.12'},
        {name: 'bar-foo', target: '0.0.7'}
      ]);

      var output = ui.output.trim();

      assert.match(output, /install packages.*foo-bar, bar-foo/);
    });

    it('does not error if ui is not present', function() {
      blueprint._exec = function() { };
      delete blueprint.ui;

      blueprint.addPackagesToProject([
        {name: 'foo-bar', target: '^123.1.12'}
      ]);

      var output = ui.output.trim();

      assert(!output.match(/install package.*foo-bar/));
    });

    it('runs task with --save-dev', function() {
      var saveDev;

      NpmInstallTask = Task.extend({
        run: function(options) {
          saveDev = options['save-dev'];
        }
      });

      blueprint.addPackagesToProject([
        {name: 'foo-bar', target: '^123.1.12'},
        {name: 'bar-foo', target: '0.0.7'}
      ]);

      assert(saveDev);
    });

    it('does not use verbose mode with the task', function() {
      var verbose;

      NpmInstallTask = Task.extend({
        run: function(options) {
          verbose = options.verbose;
        }
      });

      blueprint.addPackagesToProject([
        {name: 'foo-bar', target: '^123.1.12'},
        {name: 'bar-foo', target: '0.0.7'}
      ]);

      assert(!verbose);
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
      return rimraf(tmproot);
    });

    it('passes a packages array for addBowerPackagesToProject', function() {
      blueprint.addBowerPackagesToProject = function(packages) {
        assert.deepEqual(packages, [{name: 'foo-bar'}]);
      };

      blueprint.addBowerPackageToProject('foo-bar');
    });

    it('passes a packages array with target for addBowerPackagesToProject', function() {
      blueprint.addBowerPackagesToProject = function(packages) {
        assert.deepEqual(packages, [{name: 'foo-bar', target: '1.0.0'}]);
      };

      blueprint.addBowerPackageToProject('foo-bar', '1.0.0');
    });
  });

  describe('addBowerPackagesToProject', function() {
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
      return rimraf(tmproot);
    });

    it('looks up the `bower-install` task', function() {
      BowerInstallTask = Task.extend({
        run: function() {}
      });
      blueprint.addBowerPackagesToProject([{name: 'foo-bar'}]);

      assert.equal(taskNameLookedUp, 'bower-install');
    });

    it('calls the task with the package names', function() {
      var packages;

      BowerInstallTask = Task.extend({
        run: function(options) {
          packages = options.packages;
        }
      });

      blueprint.addBowerPackagesToProject([
        {name: 'foo-bar'},
        {name: 'bar-foo'}
      ]);

      assert.deepEqual(packages, ['foo-bar', 'bar-foo']);
    });

    it('uses the provided target (version, range, sha, etc)', function() {
      var packages;

      BowerInstallTask = Task.extend({
        run: function(options) {
          packages = options.packages;
        }
      });

      blueprint.addBowerPackagesToProject([
        {name: 'foo-bar', target: '~1.0.0'},
        {name: 'bar-foo', target: '0.7.0'}
      ]);

      assert.deepEqual(packages, ['foo-bar#~1.0.0', 'bar-foo#0.7.0']);
    });

    it('uses uses verbose mode with the task', function() {
      var verbose;

      BowerInstallTask = Task.extend({
        run: function(options) {
          verbose = options.verbose;
        }
      });

      blueprint.addBowerPackagesToProject([
        {name: 'foo-bar', target: '~1.0.0'},
        {name: 'bar-foo', target: '0.7.0'}
      ]);

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
      return rimraf(tmproot);
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

    it('will insert into the file after a specified string if options.after is specified', function(){
      var toInsert = 'blahzorz blammo';
      var line1 = 'line1 is here';
      var line2 = 'line2 here';
      var line3 = 'line3';
      var originalContent = [line1, line2, line3].join(EOL);
      var filePath = path.join(project.root, filename);

      fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

      return blueprint.insertIntoFile(filename, toInsert, {after: line2 + EOL})
        .then(function(result) {
          var contents = fs.readFileSync(path.join(project.root, filename), { encoding: 'utf8' });

          assert.equal(contents, [line1, line2, toInsert, line3].join(EOL),
                       'inserted contents should be inserted after the `after` value');
          assert.equal(result.originalContents, originalContent, 'returned object should contain original contents');
          assert(result.inserted, 'inserted should indicate that the file was modified');
        });
    });

    it('will insert into the file after the first instance of options.after only', function(){
      var toInsert = 'blahzorz blammo';
      var line1 = 'line1 is here';
      var line2 = 'line2 here';
      var line3 = 'line3';
      var originalContent = [line1, line2, line2, line3].join(EOL);
      var filePath = path.join(project.root, filename);

      fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

      return blueprint.insertIntoFile(filename, toInsert, {after: line2 + EOL})
        .then(function(result) {
          var contents = fs.readFileSync(path.join(project.root, filename), { encoding: 'utf8' });

          assert.equal(contents, [line1, line2, toInsert, line2, line3].join(EOL),
                       'inserted contents should be inserted after the `after` value');
          assert.equal(result.originalContents, originalContent, 'returned object should contain original contents');
          assert(result.inserted, 'inserted should indicate that the file was modified');
        });
    });

    it('will insert into the file before a specified string if options.before is specified', function(){
      var toInsert = 'blahzorz blammo';
      var line1 = 'line1 is here';
      var line2 = 'line2 here';
      var line3 = 'line3';
      var originalContent = [line1, line2, line3].join(EOL);
      var filePath = path.join(project.root, filename);

      fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

      return blueprint.insertIntoFile(filename, toInsert, {before: line2 + EOL})
        .then(function(result) {
          var contents = fs.readFileSync(path.join(project.root, filename), { encoding: 'utf8' });

          assert.equal(contents, [line1, toInsert, line2, line3].join(EOL),
                       'inserted contents should be inserted before the `before` value');
          assert.equal(result.originalContents, originalContent, 'returned object should contain original contents');
          assert(result.inserted, 'inserted should indicate that the file was modified');
        });
    });

    it('will insert into the file before the first instance of options.before only', function(){
      var toInsert = 'blahzorz blammo';
      var line1 = 'line1 is here';
      var line2 = 'line2 here';
      var line3 = 'line3';
      var originalContent = [line1, line2, line2, line3].join(EOL);
      var filePath = path.join(project.root, filename);

      fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

      return blueprint.insertIntoFile(filename, toInsert, {before: line2 + EOL})
        .then(function(result) {
          var contents = fs.readFileSync(path.join(project.root, filename), { encoding: 'utf8' });

          assert.equal(contents, [line1, toInsert, line2, line2, line3].join(EOL),
                       'inserted contents should be inserted after the `after` value');
          assert.equal(result.originalContents, originalContent, 'returned object should contain original contents');
          assert(result.inserted, 'inserted should indicate that the file was modified');
        });
    });


    it('it will make no change if options.after is not found in the original', function(){
      var toInsert = 'blahzorz blammo';
      var originalContent = 'the original content';
      var filePath = path.join(project.root, filename);

      fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

      return blueprint.insertIntoFile(filename, toInsert, {after: 'not found' + EOL})
        .then(function(result) {
          var contents = fs.readFileSync(path.join(project.root, filename), { encoding: 'utf8' });

          assert.equal(contents, originalContent, 'original content is unchanged');
          assert.equal(result.originalContents, originalContent, 'returned object should contain original contents');
          assert(!result.inserted, 'inserted should indicate that the file was not modified');
        });
    });

    it('it will make no change if options.before is not found in the original', function(){
      var toInsert = 'blahzorz blammo';
      var originalContent = 'the original content';
      var filePath = path.join(project.root, filename);

      fs.writeFileSync(filePath, originalContent, { encoding: 'utf8' });

      return blueprint.insertIntoFile(filename, toInsert, {before: 'not found' + EOL})
        .then(function(result) {
          var contents = fs.readFileSync(path.join(project.root, filename), { encoding: 'utf8' });

          assert.equal(contents, originalContent, 'original content is unchanged');
          assert.equal(result.originalContents, originalContent, 'returned object should contain original contents');
          assert(!result.inserted, 'inserted should indicate that the file was not modified');
        });
    });

  });

  describe('lookupBlueprint', function() {
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
      project.blueprintLookupPaths = function() {
        return [fixtureBlueprints];
      };

      filename = 'foo-bar-baz.txt';
    });

    afterEach(function() {
      return rimraf(tmproot);
    });

    it('can lookup other Blueprints from the project blueprintLookupPaths', function() {
      var result = blueprint.lookupBlueprint('basic_2');

      assert.equal(result.description, 'Another basic blueprint');
    });

    it('can find internal blueprints', function() {
      var result = blueprint.lookupBlueprint('controller');

      assert.equal(result.description, 'Generates a controller.');
    });
  });
});
