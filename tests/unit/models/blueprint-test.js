'use strict';

var fs                = require('fs');
var Blueprint         = require('../../../lib/models/blueprint');
var Task              = require('../../../lib/models/task');
var MockProject       = require('../../helpers/mock-project');
var MockUI            = require('../../helpers/mock-ui');
var expect            = require('chai').expect;
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
  'bar',
  'foo.txt',
  'test.txt'
];

describe('Blueprint', function() {
  beforeEach(function() {
    Blueprint.ignoredFiles = defaultIgnoredFiles;
  });

  describe('.mapFile', function() {
    it('replaces all occurences of __name__ with module name',function(){
      var path = Blueprint.prototype.mapFile('__name__/__name__-controller.js',{dasherizedModuleName: 'my-blueprint'});
      expect(path).to.equal('my-blueprint/my-blueprint-controller.js');

      path = Blueprint.prototype.mapFile('__name__/controller.js',{dasherizedModuleName: 'my-blueprint'});
      expect(path).to.equal('my-blueprint/controller.js');

      path = Blueprint.prototype.mapFile('__name__/__name__.js',{dasherizedModuleName: 'my-blueprint'});
      expect(path).to.equal('my-blueprint/my-blueprint.js');
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
      expect(path).to.equal('user/controller.js');

      path = Blueprint.prototype.mapFile('__path__/__name__/__type__.js',locals);
      expect(path).to.equal('pods/users/user/controller.js');
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
      expect(tokens.__foo__()).to.equal('foo');
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

      expect(fileMap).to.deep.equal(expected);
    });
  });
  describe('.lookup', function() {
    it('uses an explicit path if one is given', function() {
      var expectedClass = require(basicBlueprint);
      var blueprint = Blueprint.lookup(basicBlueprint);

      expect(blueprint.name).to.equal('basic');
      expect(blueprint.path).to.equal(basicBlueprint);
      expect(blueprint instanceof expectedClass).to.equal(true);
    });

    it('finds blueprints within given lookup paths', function() {
      var expectedClass = require(basicBlueprint);
      var blueprint = Blueprint.lookup('basic', {
        paths: [fixtureBlueprints]
      });

      expect(blueprint.name).to.equal('basic');
      expect(blueprint.path).to.equal(basicBlueprint);
      expect(blueprint instanceof expectedClass).to.equal(true);
    });

    it('finds blueprints in the ember-cli package', function() {
      var expectedPath = path.resolve(defaultBlueprints, 'app');
      var expectedClass = Blueprint;

      var blueprint = Blueprint.lookup('app');

      expect(blueprint.name).to.equal('app');
      expect(blueprint.path).to.equal(expectedPath);
      expect(blueprint instanceof expectedClass).to.equal(true);
    });

    it('can instantiate a blueprint that exports an object instead of a constructor', function() {
      var blueprint = Blueprint.lookup('exporting-object', {
        paths: [fixtureBlueprints]
      });

      expect(blueprint.woot).to.equal('someValueHere');
      expect(blueprint instanceof Blueprint).to.equal(true);
    });

    it('throws an error if no blueprint is found', function() {
      expect(function() {
        Blueprint.lookup('foo');
      }).to.throw('Unknown blueprint: foo');
    });

    it('returns undefined if no blueprint is found and ignoredMissing is passed', function() {
      var blueprint = Blueprint.lookup('foo', {
        ignoreMissing: true
      });

      expect(blueprint).to.equal(undefined);
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

      expect(actual[0]).to.deep.equal(expected[0]);
    });
  });

  it('exists', function() {
    var blueprint = new Blueprint(basicBlueprint);
    expect(!!blueprint).to.equal(true);
  });

  it('derives name from path', function() {
    var blueprint = new Blueprint(basicBlueprint);
    expect(blueprint.name).to.equal('basic');
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
      expect(!!blueprint).to.equal(true);

      return blueprint.install(options)
        .then(function() {
          var actualFiles = walkSync(tmpdir).sort();
          var output = ui.output.trim().split(EOL);

          expect(output.shift()).to.match(/^installing/);
          expect(output.shift()).to.match(/create.* .ember-cli/);
          expect(output.shift()).to.match(/create.* .gitignore/);
          expect(output.shift()).to.match(/create.* bar/);
          expect(output.shift()).to.match(/create.* foo.txt/);
          expect(output.shift()).to.match(/create.* test.txt/);
          expect(output.length).to.equal(0);

          expect(actualFiles).to.deep.equal(basicBlueprintFiles);
        });
    });

    it('re-installing identical files', function() {
      return blueprint.install(options)
        .then(function() {
          var output = ui.output.trim().split(EOL);
          ui.output = '';

          expect(output.shift()).to.match(/^installing/);
          expect(output.shift()).to.match(/create.* .ember-cli/);
          expect(output.shift()).to.match(/create.* .gitignore/);
          expect(output.shift()).to.match(/create.* bar/);
          expect(output.shift()).to.match(/create.* foo.txt/);
          expect(output.shift()).to.match(/create.* test.txt/);
          expect(output.length).to.equal(0);

          return blueprint.install(options);
        })
        .then(function() {
          var actualFiles = walkSync(tmpdir).sort();
          var output = ui.output.trim().split(EOL);

          expect(output.shift()).to.match(/^installing/);
          expect(output.shift()).to.match(/identical.* .ember-cli/);
          expect(output.shift()).to.match(/identical.* .gitignore/);
          expect(output.shift()).to.match(/identical.* bar/);
          expect(output.shift()).to.match(/identical.* foo.txt/);
          expect(output.shift()).to.match(/identical.* test.txt/);
          expect(output.length).to.equal(0);

          expect(actualFiles).to.deep.equal(basicBlueprintFiles);
        });
    });

    it('re-installing conflicting files', function() {
      return blueprint.install(options)
        .then(function() {
          var output = ui.output.trim().split(EOL);
          ui.output = '';

          expect(output.shift()).to.match(/^installing/);
          expect(output.shift()).to.match(/create.* .ember-cli/);
          expect(output.shift()).to.match(/create.* .gitignore/);
          expect(output.shift()).to.match(/create.* bar/);
          expect(output.shift()).to.match(/create.* foo.txt/);
          expect(output.shift()).to.match(/create.* test.txt/);
          expect(output.length).to.equal(0);
          var blueprintNew = new Blueprint(basicNewBlueprint);

          ui.waitForPrompt().then(function(){
            ui.inputStream.write('n' + EOL);
            return ui.waitForPrompt();
          }).then(function(){
            ui.inputStream.write('y' + EOL);
          });

          return blueprintNew.install(options);
        })
        .then(function() {
          var actualFiles = walkSync(tmpdir).sort();
          // Prompts contain \n EOL
          // Split output on \n since it will have the same affect as spliting on OS specific EOL
          var output = ui.output.trim().split('\n');
          expect(output.shift()).to.match(/^installing/);
          expect(output.shift()).to.match(/Overwrite.*foo.*\?/); // Prompt
          expect(output.shift()).to.match(/Overwrite.*foo.*No, skip/);
          expect(output.shift()).to.match(/Overwrite.*test.*\?/); // Prompt
          expect(output.shift()).to.match(/Overwrite.*test.*Yes, overwrite/);
          expect(output.shift()).to.match(/identical.* \.ember-cli/);
          expect(output.shift()).to.match(/identical.* \.gitignore/);
          expect(output.shift()).to.match(/skip.* foo.txt/);
          expect(output.shift()).to.match(/overwrite.* test.txt/);
          expect(output.length).to.equal(0);

          expect(actualFiles).to.deep.equal(basicBlueprintFiles);
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

          expect(output.shift()).to.match(/^installing/);
          expect(output.shift()).to.match(/create.* foo.txt/);
          expect(output.length).to.equal(0);

          expect(actualFiles).to.deep.equal(globFiles);
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

          expect(output.shift()).to.match(/^installing/);
          expect(output.shift()).to.match(/create.* foo.txt/);
          expect(output.shift()).to.match(/create.* test.txt/);
          expect(output.length).to.equal(0);

          expect(actualFiles).to.deep.equal(globFiles);
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

            expect(output.shift()).to.match(/^installing/);
            expect(output.shift()).to.match(/create.* .ember-cli/);
            expect(output.shift()).to.match(/create.* .gitignore/);
            expect(output.shift()).to.match(/create.* bar/);
            expect(output.shift()).to.match(/create.* foo.txt/);
            expect(output.shift()).to.match(/create.* test.txt/);
            expect(output.length).to.equal(0);

            var blueprintNew = new Blueprint(basicNewBlueprint);

            ui.waitForPrompt().then(function(){
              ui.inputStream.write('n' + EOL);
              return ui.waitForPrompt();
            }).then(function(){
              ui.inputStream.write('n' + EOL);
            });

            options.project.isEmberCLIProject = function() { return true; };

            return blueprintNew.install(options);
          })
          .then(function() {
            var actualFiles = walkSync(tmpdir).sort();
            // Prompts contain \n EOL
            // Split output on \n since it will have the same affect as spliting on OS specific EOL
            var output = ui.output.trim().split('\n');
            expect(output.shift()).to.match(/^installing/);
            expect(output.shift()).to.match(/Overwrite.*test.*\?/); // Prompt
            expect(output.shift()).to.match(/Overwrite.*test.*No, skip/);
            expect(output.shift()).to.match(/identical.* \.ember-cli/);
            expect(output.shift()).to.match(/identical.* \.gitignore/);
            expect(output.shift()).to.match(/skip.* test.txt/);
            expect(output.length).to.equal(0);

            expect(actualFiles).to.deep.equal(basicBlueprintFiles);
          });
      });
    });

    it('throws error when there is a trailing forward slash in entityName', function(){
      options.entity = { name: 'foo/' };
      expect(function() {
        blueprint.install(options);
      }).to.throw(/You specified "foo\/", but you can't use a trailing slash as an entity name with generators. Please re-run the command with "foo"./);

      options.entity = { name: 'foo\\' };
      expect(function() {
        blueprint.install(options);
      }).to.throw(/You specified "foo\\", but you can't use a trailing slash as an entity name with generators. Please re-run the command with "foo"./);

      options.entity = { name: 'foo' };
      expect(function() {
        blueprint.install(options);
      }).not.to.throw();
    });

    it('throws error when an entityName is not provided', function(){
      options.entity = { };
      expect(function() {
        blueprint.install(options);
      }).to.throw(SilentError, /The `ember generate` command requires an entity name to be specified./);
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

            expect(actualFiles).to.deep.equal(basicBlueprintFiles);
          });
    });

    it('calls normalizeEntityName before locals hook is called', function(done) {
      blueprint.normalizeEntityName = function(){ return 'foo'; };
      blueprint.locals = function(options) {
        expect(options.entity.name).to.equal('foo');
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
        expect(packages).to.deep.equal([{name: 'foo-bar'}]);
      };

      blueprint.addPackageToProject('foo-bar');
    });

    it('passes a packages array with target for addPackagesToProject', function() {
      blueprint.addPackagesToProject = function(packages) {
        expect(packages).to.deep.equal([{name: 'foo-bar', target: '^123.1.12'}]);
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

      expect(taskNameLookedUp).to.equal('npm-install');
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

      expect(packages).to.deep.equal(['foo-bar', 'bar-foo']);
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

      expect(packages).to.deep.equal(['foo-bar@^123.1.12', 'bar-foo@0.0.7']);
    });

    it('writes information to the ui log for a single package', function() {
      blueprint._exec = function() { };
      blueprint.ui = ui;

      blueprint.addPackagesToProject([
        {name: 'foo-bar', target: '^123.1.12'}
      ]);

      var output = ui.output.trim();

      expect(output).to.match(/install package.*foo-bar/);
    });

    it('writes information to the ui log for multiple packages', function() {
      blueprint._exec = function() { };
      blueprint.ui = ui;

      blueprint.addPackagesToProject([
        {name: 'foo-bar', target: '^123.1.12'},
        {name: 'bar-foo', target: '0.0.7'}
      ]);

      var output = ui.output.trim();

      expect(output).to.match(/install packages.*foo-bar, bar-foo/);
    });

    it('does not error if ui is not present', function() {
      blueprint._exec = function() { };
      delete blueprint.ui;

      blueprint.addPackagesToProject([
        {name: 'foo-bar', target: '^123.1.12'}
      ]);

      var output = ui.output.trim();

      expect(output).to.not.match(/install package.*foo-bar/);
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

      expect(!!saveDev).to.equal(true);
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

      expect(verbose).to.equal(false);
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
        expect(packages).to.deep.equal([{name: 'foo-bar'}]);
      };

      blueprint.addBowerPackageToProject('foo-bar');
    });

    it('passes a packages array with target for addBowerPackagesToProject', function() {
      blueprint.addBowerPackagesToProject = function(packages) {
        expect(packages).to.deep.equal([{name: 'foo-bar', target: '1.0.0'}]);
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

      expect(taskNameLookedUp).to.equal('bower-install');
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

      expect(packages).to.deep.equal(['foo-bar', 'bar-foo']);
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

      expect(packages).to.deep.equal(['foo-bar#~1.0.0', 'bar-foo#0.7.0']);
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

      expect(verbose).to.equal(true);
    });
  });

  describe('addAddonToProject', function() {
    var blueprint;
    var ui;
    var tmpdir;
    var AddonInstallTask;
    var taskNameLookedUp;

    beforeEach(function() {
      tmpdir    = tmp.in(tmproot);
      blueprint = new Blueprint(basicBlueprint);
      ui        = new MockUI();

      blueprint.taskFor = function(name) {
        taskNameLookedUp = name;

        return new AddonInstallTask();
      };
    });

    afterEach(function() {
      return rimraf(tmproot);
    });

    it('looks up the `addon-install` task', function() {
      AddonInstallTask = Task.extend({
        run: function() {}
      });

      blueprint.addAddonToProject('foo-bar');

      expect(taskNameLookedUp).to.equal('addon-install');
    });

    it('calls the task with package name', function() {
      var pkg;

      AddonInstallTask = Task.extend({
        run: function(options) {
          pkg = options['package'];
        }
      });

      blueprint.addAddonToProject('foo-bar');

      expect(pkg).to.equal('foo-bar');
    });

    it('calls the task with correctly parsed options', function() {
      var pkg, args;

      AddonInstallTask = Task.extend({
        run: function(options) {
          pkg  = options['package'];
          args = options['extraArgs'];
        }
      });

      blueprint.addAddonToProject({
        name: 'foo-bar',
        target: '1.0.0',
        extraArgs: ['baz']
      });

      expect(pkg).to.equal('foo-bar@1.0.0');
      expect(args).to.deep.equal(['baz']);
    });

    it('writes information to the ui log for a single package', function() {
      blueprint._exec = function() { };
      blueprint.ui = ui;

      blueprint.addAddonToProject({
        name: 'foo-bar',
        target: '^123.1.12'
      });

      var output = ui.output.trim();

      expect(output).to.match(/install addon.*foo-bar/);
    });

    it('does not error if ui is not present', function() {
      blueprint._exec = function() { };
      delete blueprint.ui;

      blueprint.addAddonToProject({
        name: 'foo-bar', target: '^123.1.12'}
      );

      var output = ui.output.trim();

      expect(output).to.not.match(/install addon.*foo-bar/);
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

          expect(contents.indexOf(toInsert) > -1).to.equal(true, 'contents were inserted');
          expect(result.originalContents).to.equal('', 'returned object should contain original contents');
          expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
          expect(contents).to.equal(result.contents, 'returned object should contain contents');
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

          expect(contents).to.equal(originalContent + toInsert, 'inserted contents should be appended to original');
          expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
          expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
        });
    });

    it('will not insert into the file if it already contains the content', function() {
      var toInsert = 'blahzorz blammo';
      var filePath = path.join(project.root, filename);

      fs.writeFileSync(filePath, toInsert, { encoding: 'utf8' });

      return blueprint.insertIntoFile(filename, toInsert)
        .then(function(result) {
          var contents = fs.readFileSync(path.join(project.root, filename), { encoding: 'utf8' });

          expect(contents).to.equal(toInsert, 'contents should be unchanged');
          expect(result.inserted).to.equal(false, 'inserted should indicate that the file was not modified');
        });
    });

    it('will insert into the file if it already contains the content if force option is passed', function() {
      var toInsert = 'blahzorz blammo';
      var filePath = path.join(project.root, filename);

      fs.writeFileSync(filePath, toInsert, { encoding: 'utf8' });

      return blueprint.insertIntoFile(filename, toInsert, { force: true })
        .then(function(result) {
          var contents = fs.readFileSync(path.join(project.root, filename), { encoding: 'utf8' });

          expect(contents).to.equal(toInsert + toInsert, 'contents should be unchanged');
          expect(result.inserted).to.equal(true, 'inserted should indicate that the file was not modified');
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

          expect(contents).to.equal([line1, line2, toInsert, line3].join(EOL),
                       'inserted contents should be inserted after the `after` value');
          expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
          expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
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

          expect(contents).to.equal([line1, line2, toInsert, line2, line3].join(EOL),
                       'inserted contents should be inserted after the `after` value');
          expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
          expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
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

          expect(contents).to.equal([line1, toInsert, line2, line3].join(EOL),
                       'inserted contents should be inserted before the `before` value');
          expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
          expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
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

          expect(contents).to.equal([line1, toInsert, line2, line2, line3].join(EOL),
                       'inserted contents should be inserted after the `after` value');
          expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
          expect(result.inserted).to.equal(true, 'inserted should indicate that the file was modified');
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

          expect(contents).to.equal(originalContent, 'original content is unchanged');
          expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
          expect(result.inserted).to.equal(false, 'inserted should indicate that the file was not modified');
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

          expect(contents).to.equal(originalContent, 'original content is unchanged');
          expect(result.originalContents).to.equal(originalContent, 'returned object should contain original contents');
          expect(result.inserted).to.equal(false, 'inserted should indicate that the file was not modified');
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

      expect(result.description).to.equal('Another basic blueprint');
    });

    it('can find internal blueprints', function() {
      var result = blueprint.lookupBlueprint('controller');

      expect(result.description).to.equal('Generates a controller.');
    });
  });
});
