'use strict';

const fs = require('fs-extra');
const path = require('path');
const Project = require('../../../lib/models/project');
const Addon = require('../../../lib/models/addon');
const RSVP = require('rsvp');
const expect = require('chai').expect;
let remove = RSVP.denodeify(fs.remove);
const findWhere = require('ember-cli-lodash-subset').find;
const MockUI = require('console-ui/mock');
const MockCLI = require('../../helpers/mock-cli');
const mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');

const broccoli = require('broccoli-builder');
const walkSync = require('walk-sync');
const td = require('testdouble');

let root = process.cwd();
let tmproot = path.join(root, 'tmp');

let fixturePath = path.resolve(__dirname, '../../fixtures/addon');
const ensurePosixPath = require('ensure-posix-path');

describe('models/addon.js', function() {
  let addon, project, projectPath;

  describe('root property', function() {
    it('is required', function() {
      expect(() => {
        let TheAddon = Addon.extend({ root: undefined });
        new TheAddon();
      }).to.throw(/root/);
    });
  });

  describe('old core object compat', function() {
    it('treeGenerator works without .project', function() {
      let warning;
      let TheAddon = Addon.extend({
        name: 'such name',
        root: path.resolve(fixturePath, 'simple'),
        _warn(message) {
          warning = `${message}`;
        },
      });
      let addon = new TheAddon();
      expect(() => {
        addon.treeGenerator('foo');
      }).to.not.throw();
      expect(warning).to.match(/Addon: `such name` is missing addon.project/);
    });
  });

  describe('treePaths and treeForMethods', function() {
    let FirstAddon, SecondAddon;

    beforeEach(function() {
      projectPath = path.resolve(fixturePath, 'simple');
      const packageContents = require(path.join(projectPath, 'package.json'));
      let cli = new MockCLI();

      project = new Project(projectPath, packageContents, cli.ui, cli);

      FirstAddon = Addon.extend({
        name: 'first',
        root: projectPath,

        init() {
          this._super.apply(this, arguments);
          this.treePaths.vendor = 'blazorz';
          this.treeForMethods.public = 'huzzah!';
        },
      });

      SecondAddon = Addon.extend({
        name: 'first',
        root: projectPath,

        init() {
          this._super.apply(this, arguments);
          this.treePaths.vendor = 'blammo';
          this.treeForMethods.public = 'boooo';
        },
      });

    });

    describe('.jshintAddonTree', function() {
      let addon;

      beforeEach(function() {
        addon = new FirstAddon(project, project);

        // TODO: fix config story...
        addon.app = {
          options: { jshintrc: {} },
          addonLintTree(type, tree) { return tree; },
        };

        addon.jshintTrees = function() {};

      });

      it('uses the fullPath', function() {
        let addonPath;
        addon.addonJsFiles = function(_path) {
          addonPath = _path;
          return _path;
        };

        let root = path.join(fixturePath, 'with-styles');
        addon.root = root;

        addon.jshintAddonTree();
        expect(addonPath).to.eql(ensurePosixPath(path.join(root, 'addon')));
      });

      it('lints the files before preprocessing', function() {
        addon.preprocessJs = function() {
          throw new Error('should not preprocess files');
        };

        let root = path.join(fixturePath, 'with-styles');
        addon.root = root;

        addon.jshintAddonTree();
      });

    });

    it('modifying a treePath does not affect other addons', function() {
      let first = new FirstAddon(project);
      let second = new SecondAddon(project);

      expect(first.treePaths.vendor).to.equal('blazorz');
      expect(second.treePaths.vendor).to.equal('blammo');
    });

    it('modifying a treeForMethod does not affect other addons', function() {
      let first = new FirstAddon(project);
      let second = new SecondAddon(project);

      expect(first.treeForMethods.public).to.equal('huzzah!');
      expect(second.treeForMethods.public).to.equal('boooo');
    });
  });

  describe('resolvePath', function() {
    beforeEach(function() {
      addon = {
        pkg: {
          'ember-addon': {
            'main': '',
          },
        },
        path: '',
      };
    });

    it('adds .js if not present', function() {
      addon.pkg['ember-addon']['main'] = 'index';
      let resolvedFile = path.basename(Addon.resolvePath(addon));
      expect(resolvedFile).to.equal('index.js');
    });

    it('doesn\'t add .js if it is .js', function() {
      addon.pkg['ember-addon']['main'] = 'index.js';
      let resolvedFile = path.basename(Addon.resolvePath(addon));
      expect(resolvedFile).to.equal('index.js');
    });

    it('doesn\'t add .js if it has another extension', function() {
      addon.pkg['ember-addon']['main'] = 'index.coffee';
      let resolvedFile = path.basename(Addon.resolvePath(addon));
      expect(resolvedFile).to.equal('index.coffee');
    });

    it('allows lookup of non-`index.js` `main` entry points', function() {
      delete addon.pkg['ember-addon'];
      addon.pkg['main'] = 'some/other/path.js';

      let resolvedFile = Addon.resolvePath(addon);
      expect(resolvedFile).to.equal(path.join(process.cwd(), 'some/other/path.js'));
    });

    it('falls back to `index.js` if `main` and `ember-addon` are not found', function() {
      delete addon.pkg['ember-addon'];

      let resolvedFile = Addon.resolvePath(addon);
      expect(resolvedFile).to.equal(path.join(process.cwd(), 'index.js'));
    });

    it('falls back to `index.js` if `main` and `ember-addon.main` are not found', function() {
      delete addon.pkg['ember-addon'].main;

      let resolvedFile = Addon.resolvePath(addon);
      expect(resolvedFile).to.equal(path.join(process.cwd(), 'index.js'));
    });
  });

  describe('initialized addon', function() {
    this.timeout(40000);
    before(function() {
      projectPath = path.resolve(fixturePath, 'simple');
      const packageContents = require(path.join(projectPath, 'package.json'));
      let ui = new MockUI();
      let cli = new MockCLI({ ui });
      project = new Project(projectPath, packageContents, ui, cli);
      let discoverFromCli = td.replace(project.addonDiscovery, 'discoverFromCli');
      td.when(discoverFromCli(), { ignoreExtraArgs: true }).thenReturn([]);
      project.initializeAddons();
    });

    describe('generated addon', function() {
      beforeEach(function() {
        addon = findWhere(project.addons, { name: 'Ember CLI Generated with export' });

        // Clear the caches
        delete addon._moduleName;
      });

      it('sets its project', function() {
        expect(addon.project.name).to.equal(project.name);
      });

      it('sets its parent', function() {
        expect(addon.parent.name).to.equal(project.name);
      });

      it('sets the root', function() {
        expect(addon.root).to.not.equal(undefined);
      });

      it('sets the pkg', function() {
        expect(addon.pkg).to.not.equal(undefined);
      });

      describe('trees for its treePaths', function() {
        it('app', function() {
          let tree = addon.treeFor('app');
          expect(typeof (tree.read || tree.rebuild)).to.equal('function');
        });

        it('styles', function() {
          let tree = addon.treeFor('styles');
          expect(typeof (tree.read || tree.rebuild)).to.equal('function');
        });

        it('templates', function() {
          let tree = addon.treeFor('templates');
          expect(typeof (tree.read || tree.rebuild)).to.equal('function');
        });

        it('addon-templates', function() {
          let tree = addon.treeFor('addon-templates');
          expect(typeof (tree.read || tree.rebuild)).to.equal('function');
        });

        it('vendor', function() {
          let tree = addon.treeFor('vendor');
          expect(typeof (tree.read || tree.rebuild)).to.equal('function');
        });

        it('addon', function() {
          let app = {
            importWhitelist: {},
            options: {},
          };
          addon.registry = {
            app: addon,
            load() {
              return [{
                toTree(tree) {
                  return tree;
                },
              }];
            },

            extensionsForType() {
              return ['js'];
            },
          };
          addon.app = app;
          let tree = addon.treeFor('addon');
          expect(typeof (tree.read || tree.rebuild)).to.equal('function');
        });
      });

      describe('custom treeFor methods', function() {
        it('can define treeForApp', function() {
          addon.treeForApp = td.function();
          addon.treeFor('app');
          td.verify(addon.treeForApp(), { ignoreExtraArgs: true });
        });

        it('can define treeForStyles', function() {
          addon.treeForStyles = td.function();
          addon.treeFor('styles');
          td.verify(addon.treeForStyles(), { ignoreExtraArgs: true });
        });

        it('can define treeForVendor', function() {
          addon.treeForVendor = td.function();
          addon.treeFor('vendor');
          td.verify(addon.treeForVendor(), { ignoreExtraArgs: true });
        });

        it('can define treeForTemplates', function() {
          addon.treeForTemplates = td.function();
          addon.treeFor('templates');
          td.verify(addon.treeForTemplates(), { ignoreExtraArgs: true });
        });

        it('can define treeForAddonTemplates', function() {
          addon.treeForAddonTemplates = td.function();
          addon.treeFor('addon-templates');
          td.verify(addon.treeForAddonTemplates(), { ignoreExtraArgs: true });
        });

        it('can define treeForPublic', function() {
          addon.treeForPublic = td.function();
          addon.treeFor('public');
          td.verify(addon.treeForPublic(), { ignoreExtraArgs: true });
        });
      });
    });

    describe('addon with dependencies', function() {
      beforeEach(function() {
        addon = findWhere(project.addons, { name: 'Ember Addon With Dependencies' });
      });

      it('returns a listing of all dependencies in the addon\'s package.json', function() {
        let expected = {
          'ember-cli': 'latest',
          'something-else': 'latest',
        };

        expect(addon.dependencies()).to.deep.equal(expected);
      });
    });

    it('must define a `name` property', function() {
      let Foo = Addon.extend({ root: 'foo' });

      expect(() => {
        new Foo(project);
      }).to.throw(/An addon must define a `name` property./);
    });

    describe('isDevelopingAddon', function() {
      let originalEnvValue, addon, project;

      beforeEach(function() {
        let MyAddon = Addon.extend({
          name: 'test-project',
          root: 'foo',
        });

        let projectPath = path.resolve(fixturePath, 'simple');
        const packageContents = require(path.join(projectPath, 'package.json'));
        let cli = new MockCLI();

        project = new Project(projectPath, packageContents, cli.ui, cli);

        addon = new MyAddon(project, project);

        originalEnvValue = process.env.EMBER_ADDON_ENV;
      });

      afterEach(function() {
        if (originalEnvValue === undefined) {
          delete process.env.EMBER_ADDON_ENV;
        } else {
          process.env.EMBER_ADDON_ENV = originalEnvValue;
        }
      });

      it('returns true when `EMBER_ADDON_ENV` is set to development', function() {
        process.env.EMBER_ADDON_ENV = 'development';

        expect(addon.isDevelopingAddon(), 'addon is being developed').to.eql(true);
      });

      it('returns true when the addon name is prefixed in package.json and not in index.js', function() {
        process.env.EMBER_ADDON_ENV = 'development';

        project.name = () => ('@foo/my-addon');
        addon.name = 'my-addon';
        expect(addon.isDevelopingAddon(), 'addon is being developed').to.eql(true);
      });

      it('returns false when `EMBER_ADDON_ENV` is not set', function() {
        delete process.env.EMBER_ADDON_ENV;

        expect(addon.isDevelopingAddon()).to.eql(false);
      });

      it('returns false when `EMBER_ADDON_ENV` is something other than `development`', function() {
        process.env.EMBER_ADDON_ENV = 'production';

        expect(addon.isDevelopingAddon()).to.equal(false);
      });

      it('returns false when the addon is not the one being developed', function() {
        process.env.EMBER_ADDON_ENV = 'development';

        addon.name = 'my-addon';
        expect(addon.isDevelopingAddon(), 'addon is not being developed').to.eql(false);
      });
    });

    describe('findOwnAddonByName', function() {
      let ThisAddon = Addon.extend({
        root: 'foo',
        name: 'this-addon',
      });

      it('it has the given addon', function() {
        let addon = new ThisAddon();
        let ownAddon = { name: 'my-cool-addon' };
        addon.addons = [ownAddon];
        expect(addon.findOwnAddonByName('my-cool-addon')).to.eql(ownAddon);
      });

      it('it does not have the given addon', function() {
        let addon = new ThisAddon();
        let ownAddon = { name: 'my-cool-addon' };
        addon.addons = [ownAddon];
        expect(addon.findOwnAddonByName('my-non-existentcool-addon')).to.eql(undefined);
      });
    });

    describe('hintingEnabled', function() {
      /**
        Tests the various configuration options that affect the hintingEnabled method.

       | configuration | test1 | test2 | test3 | test4 | test5 |
       | ------------- | ----- | ----- | ----- | ----- | ----- |
       | hinting       | true  | true  | true  | false | unset |
       | environment   | dev   | N/A   | prod  | N\A   | N\A   |
       | test_command  | set   | set   | unset | set   | set   |
       | RESULT        | true  | true  | false | false | true  |

        @method hintingEnabled
       */

      let originalEnvValue, originalEmberEnvValue, originalTestCommand, addon, project;

      beforeEach(function() {
        let MyAddon = Addon.extend({
          name: 'test-project',
          root: 'foo',
        });

        let projectPath = path.resolve(fixturePath, 'simple');
        const packageContents = require(path.join(projectPath, 'package.json'));
        let cli = new MockCLI();

        project = new Project(projectPath, packageContents, cli.ui, cli);

        addon = new MyAddon(project);

        originalEmberEnvValue = process.env.EMBER_ENV;
        originalEnvValue = process.env.EMBER_ADDON_ENV;
        originalTestCommand = process.env.EMBER_CLI_TEST_COMMAND;
      });

      afterEach(function() {
        addon.app = {
          options: {},
        };

        if (originalEnvValue === undefined) {
          delete process.env.EMBER_ADDON_ENV;
        } else {
          process.env.EMBER_ADDON_ENV = originalEnvValue;
        }

        if (originalTestCommand === undefined) {
          delete process.env.EMBER_CLI_TEST_COMMAND;
        } else {
          process.env.EMBER_CLI_TEST_COMMAND = originalTestCommand;
        }

        if (originalEmberEnvValue === undefined) {
          delete process.env.EMBER_ENV;
        } else {
          process.env.EMBER_ENV = originalEmberEnvValue;
        }
      });

      it('returns true when `EMBER_ENV` is not set to production and options.hinting is true', function() {
        process.env.EMBER_ENV = 'development';

        addon.app = {
          options: { hinting: true },
        };

        expect(addon.hintingEnabled()).to.be.true;
      });

      it('returns true when `EMBER_CLI_TEST_COMMAND` is set and options.hinting is true', function() {
        addon.app = {
          options: { hinting: true },
        };

        expect(addon.hintingEnabled()).to.be.true;
      });

      it('returns false when `EMBER_ENV` is set to production, `EMBER_CLI_TEST_COMMAND` is unset and options.hinting is true', function() {
        process.env.EMBER_ENV = 'production';
        delete process.env.EMBER_CLI_TEST_COMMAND;

        addon.app = {
          options: { hinting: true },
        };

        expect(addon.hintingEnabled()).to.be.false;
      });

      it('returns false when options.hinting is set to false', function() {
        addon.app = {
          options: { hinting: false },
        };

        expect(addon.hintingEnabled()).to.be.false;
      });

      it('returns true when options.hinting is not set', function() {
        expect(addon.hintingEnabled()).to.be.ok;
      });
    });

    describe('treeGenerator', function() {
      it('watch tree when developing the addon itself', function() {
        addon.isDevelopingAddon = function() { return true; };

        let tree = addon.treeGenerator('foo/bar');

        expect(tree.__broccoliGetInfo__()).to.have.property('watched', true);
      });

      it('uses UnwatchedDir when not developing the addon itself', function() {
        addon.isDevelopingAddon = function() { return false; };

        let tree = addon.treeGenerator('foo/bar');

        expect(tree.__broccoliGetInfo__()).to.have.property('watched', false);
      });
    });

    describe('blueprintsPath', function() {
      let tmpdir;

      beforeEach(function() {
        return mkTmpDirIn(tmproot).then(function(dir) {
          tmpdir = dir;
          addon.root = tmpdir;
        });
      });

      afterEach(function() {
        return remove(tmproot);
      });

      it('returns undefined if the `blueprint` folder does not exist', function() {
        let returnedPath = addon.blueprintsPath();

        expect(returnedPath).to.equal(undefined);
      });

      it('returns blueprint path if the folder exists', function() {
        let blueprintsDir = path.join(tmpdir, 'blueprints');
        fs.mkdirSync(blueprintsDir);

        let returnedPath = addon.blueprintsPath();

        expect(returnedPath).to.equal(blueprintsDir);
      });
    });

    describe('config', function() {
      it('returns undefined if `config/environment.js` does not exist', function() {
        addon.root = path.join(fixturePath, 'no-config');
        let result = addon.config();

        expect(result).to.equal(undefined);
      });

      it('returns blueprint path if the folder exists', function() {
        addon.root = path.join(fixturePath, 'with-config');
        let appConfig = {};

        addon.config('development', appConfig);

        expect(appConfig.addon).to.equal('with-config');
      });
    });
  });

  describe('Addon.lookup', function() {
    it('should throw an error if an addon could not be found', function() {
      let addon = {
        path: 'foo/bar-baz/blah/doesnt-exist',
        pkg: {
          name: 'dummy-addon',
          'ember-addon': { },
        },
      };

      expect(() => {
        Addon.lookup(addon);
      }).to.throw(/The `dummy-addon` addon could not be found at `foo\/bar-baz\/blah\/doesnt-exist`\./);
    });
  });

  describe('compileTemplates', function() {
    beforeEach(function() {
      projectPath = path.resolve(fixturePath, 'simple');
      const packageContents = require(path.join(projectPath, 'package.json'));
      let cli = new MockCLI();

      project = new Project(projectPath, packageContents, cli.ui, cli);
      let discoverFromCli = td.replace(project.addonDiscovery, 'discoverFromCli');
      td.when(discoverFromCli(), { ignoreExtraArgs: true }).thenReturn([]);

      project.initializeAddons();

      addon = findWhere(project.addons, { name: 'Ember CLI Generated with export' });
    });

    it('should not throw an error if addon/templates is present but empty', function() {
      addon.root = path.join(fixturePath, 'with-empty-addon-templates');

      expect(() => {
        addon.compileTemplates();
      }).not.to.throw();
    });
  });

  describe('_fileSystemInfo', function() {
    beforeEach(function() {
      projectPath = path.resolve(fixturePath, 'simple');
      const packageContents = require(path.join(projectPath, 'package.json'));
      let cli = new MockCLI();

      project = new Project(projectPath, packageContents, cli.ui, cli);
      let discoverFromCli = td.replace(project.addonDiscovery, 'discoverFromCli');
      td.when(discoverFromCli(), { ignoreExtraArgs: true }).thenReturn([]);

      project.initializeAddons();

      addon = findWhere(project.addons, { name: 'Ember CLI Generated with export' });
    });

    it('should not call _getAddonTemplatesTreeFiles when default treePath is used', function() {
      let wasCalled = false;
      addon._getAddonTemplatesTreeFiles = function() {
        wasCalled = true;
        return [];
      };

      addon._fileSystemInfo();

      expect(wasCalled).to.not.be.ok;
    });

    it('should call _getAddonTemplatesTreeFiles when custom treePaths[\'addon-templates\'] is used', function() {
      addon.treePaths['addon-templates'] = 'foo';
      let wasCalled = false;
      addon._getAddonTemplatesTreeFiles = function() {
        wasCalled = true;
        return [];
      };

      addon._fileSystemInfo();

      expect(wasCalled).to.be.ok;
    });

    it('hasPodTemplates when pod templates found', function() {
      addon._getAddonTreeFiles = function() {
        return [
          'foo-bar/',
          'foo-bar/component.js',
          'foo-bar/template.hbs',
        ];
      };

      expect(addon._fileSystemInfo()).to.deep.equal({
        hasJSFiles: true,
        hasTemplates: true,
        hasPodTemplates: true,
      });
    });

    it('does not hasPodTemplates when no pod templates found', function() {
      addon._getAddonTreeFiles = function() {
        return [
          'templates/',
          'templates/components/',
          'templates/components/foo-bar.hbs',
        ];
      };

      expect(addon._fileSystemInfo()).to.deep.equal({
        hasJSFiles: false,
        hasTemplates: true,
        hasPodTemplates: false,
      });
    });

    it('does not hasPodTemplates when no pod templates found (pod-like structure in `addon/templates/`)', function() {
      addon._getAddonTreeFiles = function() {
        return [
          'templates/',
          // this doesn't need "pod template handling" because
          // it is actually in the addon-templates tree
          'templates/foo-bar/template.hbs',
        ];
      };

      expect(addon._fileSystemInfo()).to.deep.equal({
        hasJSFiles: false,
        hasTemplates: true,
        hasPodTemplates: false,
      });
    });

    it('does not hasTemplates when no templates found', function() {
      addon._getAddonTreeFiles = function() {
        return [
          'components/',
          'components/foo-bar.js',
          'templates/',
          'templates/components/',
        ];
      };

      expect(addon._fileSystemInfo()).to.deep.equal({
        hasJSFiles: true,
        hasTemplates: false,
        hasPodTemplates: false,
      });
    });

    it('does not hasJSFiles when none found', function() {
      addon._getAddonTreeFiles = function() {
        return [
          'components/',
          'templates/',
          'templates/components/',
          'styles/foo.css',
        ];
      };

      expect(addon._fileSystemInfo()).to.deep.equal({
        hasJSFiles: false,
        hasTemplates: false,
        hasPodTemplates: false,
      });
    });
  });

  describe('addonDiscovery', function() {
    let discovery, addon, ui;

    beforeEach(function() {
      projectPath = path.resolve(fixturePath, 'simple');
      const packageContents = require(path.join(projectPath, 'package.json'));

      ui = new MockUI();
      let cli = new MockCLI({ ui });
      project = new Project(projectPath, packageContents, ui, cli);

      let AddonTemp = Addon.extend({
        name: 'temp',
        root: 'foo',
      });

      addon = new AddonTemp(project, project);
      discovery = addon.addonDiscovery;
    });

    it('is provided with the addon\'s `ui` object', function() {
      expect(discovery.ui).to.equal(ui);
    });
  });

  describe('treeForStyles', function() {
    let builder, addon;

    beforeEach(function() {
      projectPath = path.resolve(fixturePath, 'with-app-styles');
      const packageContents = require(path.join(projectPath, 'package.json'));
      let cli = new MockCLI();

      project = new Project(projectPath, packageContents, cli.ui, cli);

      let BaseAddon = Addon.extend({
        name: 'base-addon',
        root: projectPath,
      });

      addon = new BaseAddon(project, project);
    });

    afterEach(function() {
      if (builder) {
        return builder.cleanup();
      }
    });

    it('should move files in the root of the addons app/styles tree into the app/styles path', function() {
      builder = new broccoli.Builder(addon.treeFor('styles'));

      return builder.build()
        .then(function(results) {
          let outputPath = results.directory;

          let expected = [
            'app/',
            'app/styles/',
            'app/styles/foo-bar.css',
          ];

          expect(walkSync(outputPath)).to.eql(expected);
        });
    });
  });

  describe('._eachProjectAddonInvoke', function() {
    beforeEach(function() {
      let MyAddon = Addon.extend({
        name: 'test-project',
        root: 'foo',
      });

      let projectPath = path.resolve(fixturePath, 'simple');
      const packageContents = require(path.join(projectPath, 'package.json'));
      let cli = new MockCLI();

      project = new Project(projectPath, packageContents, cli.ui, cli);
      addon = new MyAddon(project, project);
    });

    it('should invoke the method on each of the project addons', function() {
      let counter = 0;
      project.addons = [
        { foo(num) { counter += num; } },
        { foo(num) { counter += num; } },
      ];

      addon._eachProjectAddonInvoke('foo', [1]);
      expect(counter).to.eql(2);
    });

    it('should provide default arguments if none are specified', function() {
      let counter = 0;
      project.addons = [
        { foo() { counter += 1; } },
        { foo() { counter += 1; } },
      ];

      addon._eachProjectAddonInvoke('foo');
      expect(counter).to.eql(2);
    });
  });

  describe('addon tree caching', function() {
    let projectPath = path.resolve(fixturePath, 'simple');
    const packageContents = require(path.join(projectPath, 'package.json'));

    function createAddon(Addon) {
      let cli = new MockCLI();
      let project = new Project(projectPath, packageContents, cli.ui, cli);
      return new Addon(project, project);
    }

    describe('cacheKeyForTree', function() {
      it('returns null if `treeForApp` methods are implemented for the app tree', function() {
        let addon = createAddon(Addon.extend({
          name: 'test-project',
          root: 'foo',
          treeForApp() { },
        }));

        expect(addon.cacheKeyForTree('app')).to.equal(null);
      });

      it('returns null if `compileAddon` methods are implemented for the addon tree', function() {
        let addon = createAddon(Addon.extend({
          name: 'test-project',
          root: 'foo',
          compileAddon() { },
        }));

        expect(addon.cacheKeyForTree('addon')).to.equal(null);
      });

      it('returns null if `treeForMethods` is modified', function() {
        let addon = createAddon(Addon.extend({
          name: 'test-project',
          root: 'foo',
          init() {
            this._super && this._super.init.apply(this, arguments);

            this.treeForMethods['app'] = 'treeForZOMG_WHY!?!';
          },
        }));

        expect(addon.cacheKeyForTree('app')).to.equal(null);
      });

      it('returns stable value for repeated invocations', function() {
        let addon = createAddon(Addon.extend({
          name: 'test-project',
          root: 'foo',
        }));

        let firstResult = addon.cacheKeyForTree('app');
        let secondResult = addon.cacheKeyForTree('app');

        expect(firstResult).to.equal(secondResult);
      });
    });

    describe('treeFor caching', function() {
      it('defining custom treeForAddon without modifying cacheKeyForTree does not cache', function() {
        let addon = createAddon(Addon.extend({
          name: 'test-project',
          root: path.join(projectPath, 'node_modules', 'ember-generated-with-export-addon'),
          treeForAddon(tree) {
            return tree;
          },
        }));

        let firstTree = addon.treeFor('addon');
        let secondTree = addon.treeFor('addon');

        expect(firstTree).not.to.equal(secondTree);
      });

      it('defining custom cacheKeyForTree allows addon control of cache', function() {
        let addonProto = {
          name: 'test-project',
          root: path.join(projectPath, 'node_modules', 'ember-generated-with-export-addon'),
          treeForAddon(tree) {
            return tree;
          },
        };
        addonProto.cacheKeyForTree = function(type) {
          return type;
        };

        let addon = createAddon(Addon.extend(addonProto));
        let firstTree = addon.treeFor('addon');
        let secondTree = addon.treeFor('addon');

        expect(firstTree).to.equal(secondTree);
      });
    });
  });
});
