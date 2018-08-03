'use strict';

const path = require('path');
const fs = require('fs-extra');
const Project = require('../../../lib/models/project');
const Addon = require('../../../lib/models/addon');
const tmp = require('../../helpers/tmp');
const touch = require('../../helpers/file-utils').touch;
const expect = require('chai').expect;
const emberCLIVersion = require('../../../lib/utilities/version-utils').emberCLIVersion;
const td = require('testdouble');
const MockCLI = require('../../helpers/mock-cli');
const experiments = require('../../../lib/experiments');

describe('models/project.js', function() {
  let project, projectPath, packageContents;

  function makeProject() {
    let cli = new MockCLI();
    project = new Project(projectPath, packageContents, cli.ui, cli);
  }

  beforeEach(function() {
    packageContents = {};
  });

  afterEach(function() {
    if (project) { project = null; }
  });

  describe('constructor', function() {
    it('sets up bidirectional instrumentation', function() {
      let cli = new MockCLI();

      expect(cli.instrumentation.project).to.equal(null);

      projectPath = 'tmp/test-app';
      return tmp.setup(projectPath)
        .then(function() {
          touch(`${projectPath}/config/environment.js`, {
            baseURL: '/foo/bar',
          });

          project = new Project(projectPath, { }, cli.ui, cli);
          expect(cli.instrumentation.project).to.equal(project);
          expect(project._instrumentation).to.equal(cli.instrumentation);
        });
    });
  });

  describe('Project.prototype.config', function() {
    let called;
    projectPath = 'tmp/test-app';

    beforeEach(function() {
      called = false;
      return tmp.setup(projectPath)
        .then(function() {
          touch(`${projectPath}/config/environment.js`, {
            baseURL: '/foo/bar',
          });

          touch(`${projectPath}/config/a.js`, {
            baseURL: '/a',
          });

          touch(`${projectPath}/config/b.js`, {
            baseURL: '/b',
          });

          makeProject();

          project.require = function() {
            called = true;
            return function() {};
          };
        });
    });

    afterEach(function() {
      called = null;
      return tmp.teardown(projectPath);
    });

    it('config() finds and requires config/environment', function() {
      project.config('development');
      expect(called).to.equal(true);
    });

    describe('memoizes', function() {
      it('memoizes', function() {
        project.config('development');
        expect(called).to.equal(true);
        called = false;
        project.config('development');
        expect(called).to.equal(false);
      });

      it('considers configPath when memoizing', function() {
        project.configPath = function() { return `${projectPath}/config/a`; };
        project.config('development');

        expect(called).to.equal(true);
        called = false;

        project.configPath = function() { return `${projectPath}/config/a`; };
        project.config('development');

        expect(called).to.equal(false);
        called = false;

        project.configPath = function() { return `${projectPath}/config/b`; };
        project.config('development');

        expect(called).to.equal(true);
        called = false;

        project.config('development');

        expect(called).to.equal(false);
        called = false;
      });
    });

    it('configPath() returns tests/dummy/config/environment', function() {
      project.pkg = {
        'ember-addon': {
          'configPath': 'tests/dummy/config',
        },
      };

      let expected = path.normalize('tests/dummy/config/environment');

      expect(project.configPath().slice(-expected.length)).to.equal(expected);
    });

    it('calls getAddonsConfig', function() {
      let addonConfigCalled = false;

      project.getAddonsConfig = function() {
        addonConfigCalled = true;

        return {};
      };

      project.config('development');
      expect(addonConfigCalled).to.equal(true);
    });

    it('returns getAddonsConfig result when configPath is not present', function() {
      let expected = {
        foo: 'bar',
      };

      project.getAddonsConfig = function() {
        return expected;
      };

      let actual = project.config('development');
      expect(actual).to.deep.equal(expected);
    });

    describe('merges getAddonsConfig result with app config', function() {
      let projectConfig, addon1Config, addon2Config;

      beforeEach(function() {
        addon1Config = { addon: { derp: 'herp' } };
        addon2Config = { addon: { blammo: 'blahzorz' } };

        projectConfig = { foo: 'bar', baz: 'qux' };
        project.addons = [
          { config() { return addon1Config; } },
          { config() { return addon2Config; } },
        ];

        project._addonsInitialized = true;

        project.require = function() {
          return function() {
            return projectConfig;
          };
        };
      });

      it('merges getAddonsConfig result with app config', function() {
        let expected = {
          foo: 'bar',
          baz: 'qux',
          addon: {
            derp: 'herp',
            blammo: 'blahzorz',
          },
        };

        let actual = project.config('development');
        expect(actual).to.deep.equal(expected);
      });

      it('getAddonsConfig does NOT override project config', function() {
        let expected = {
          foo: 'bar',
          baz: 'qux',
          addon: {
            derp: 'herp',
            blammo: 'blahzorz',
          },
        };

        addon1Config.foo = 'NO!!!!!!';

        let actual = project.config('development');
        expect(actual).to.deep.equal(expected);
      });
    });
  });

  describe('Project.prototype.targets', function() {

    beforeEach(function() {
      projectPath = 'tmp/test-app';
    });

    afterEach(function() {
      return tmp.teardown(projectPath);
    });

    describe('when the is a `/config/targets.js` file', function() {
      beforeEach(function() {
        return tmp.setup(projectPath).then(function() {
          let targetsPath = path.join(projectPath, 'config', 'targets.js');
          fs.createFileSync(targetsPath);
          fs.writeFileSync(
            targetsPath,
            'module.exports = { browsers: ["last 2 versions", "safari >= 7"] };',
            { encoding: 'utf8' }
          );

          makeProject();

          project.require = function() {
            return { browsers: ["last 2 versions", "safari >= 7"] };
          };
        });
      });

      it('returns the object defined in `/config/targets` if present', function() {
        expect(project.targets).to.deep.equal({
          browsers: ['last 2 versions', 'safari >= 7'],
        });
      });
    });

    describe('when there isn\'t a `/config/targets.js` file', function() {
      beforeEach(function() {
        return tmp.setup(projectPath).then(function() {
          makeProject();
        });
      });

      it('returns the default targets', function() {
        expect(project.targets).to.deep.equal({
          browsers: [
            'ie 9',
            'last 1 Chrome versions',
            'last 1 Firefox versions',
            'last 1 Safari versions',
          ],
        });
      });
    });
  });

  describe('addons', function() {
    beforeEach(function() {
      projectPath = path.resolve(__dirname, '../../fixtures/addon/simple');
      packageContents = require(path.join(projectPath, 'package.json'));

      makeProject();

      project.initializeAddons();
    });

    it('returns a listing of all dependencies in the project\'s package.json', function() {
      let expected = {
        'ember-cli': 'latest',
        'ember-random-addon': 'latest',
        'ember-resolver': '^5.0.1',
        'ember-non-root-addon': 'latest',
        'ember-generated-with-export-addon': 'latest',
        'non-ember-thingy': 'latest',
        'ember-before-blueprint-addon': 'latest',
        'ember-after-blueprint-addon': 'latest',
        'something-else': 'latest',
        'ember-devDeps-addon': 'latest',
        'ember-addon-with-dependencies': 'latest',
        'loader.js': 'latest',
      };

      expect(project.dependencies()).to.deep.equal(expected);
    });

    it('returns a listing of all dependencies in the project\'s bower.json', function() {
      let expected = {
        'jquery': '^1.11.1',
        'ember': '1.7.0',
        'ember-data': '1.0.0-beta.10',
        'ember-cli-shims': 'ember-cli/ember-cli-shims#0.0.3',
        'ember-qunit': '0.1.8',
        'qunit': '~1.15.0',
      };

      expect(project.bowerDependencies()).to.deep.equal(expected);
    });

    it('returns a listing of all ember-cli-addons directly depended on by the project', function() {
      let expected = [
        'testem-url-rewriter-middleware',
        'tests-server-middleware',
        'history-support-middleware',
        'broccoli-watcher', 'broccoli-serve-files',
        'proxy-server-middleware', 'amd-transform',
        'ember-random-addon', 'ember-non-root-addon',
        'ember-generated-with-export-addon',
        'ember-before-blueprint-addon', 'ember-after-blueprint-addon',
        'ember-devDeps-addon', 'ember-addon-with-dependencies', 'ember-super-button',
      ];
      expect(Object.keys(project.addonPackages)).to.deep.eql(expected);
    });

    it('returns instances of the addons', function() {
      let addons = project.addons;

      expect(addons.find(a => a.name === 'ember-non-root-addon')).to.be;

      let superButton = addons.find(a => a.name === 'ember-super-button');
      expect(!!superButton).to.be;
      expect(superButton.addons.find(a => a.name === 'ember-yagni')).to.be;
      expect(superButton.addons.find(a => a.name === 'ember-ng')).to.be;
    });

    it('addons get passed the project instance', function() {
      let addons = project.addons;

      addons.forEach(addon => expect(addon.project).to.eql(project));
    });

    it('returns an instance of an addon that uses `ember-addon-main`', function() {
      let addons = project.addons;

      expect(!!addons.find(a => a.name === 'ember-random-addon')).to.be;
    });

    it('returns the default blueprints path', function() {
      let expected = project.root + path.normalize('/blueprints');

      expect(project.localBlueprintLookupPath()).to.equal(expected);
    });

    it('returns a listing of all addon blueprints paths ordered by last loaded when called once', function() {
      let loadedBlueprintPaths = [
        project.root + path.normalize('/node_modules/ember-before-blueprint-addon/blueprints'),
        project.root + path.normalize('/node_modules/ember-random-addon/blueprints'),
        project.root + path.normalize('/node_modules/ember-after-blueprint-addon/blueprints'),
      ];

      // the first found addon blueprint should be the last one defined
      let expected = loadedBlueprintPaths.reverse();
      let first = project.addonBlueprintLookupPaths();

      expect(first).to.deep.equal(expected);
    });

    it('returns a listing of all addon blueprints paths ordered by last loaded when called twice', function() {
      let loadedBlueprintPaths = [
        project.root + path.normalize('/node_modules/ember-before-blueprint-addon/blueprints'),
        project.root + path.normalize('/node_modules/ember-random-addon/blueprints'),
        project.root + path.normalize('/node_modules/ember-after-blueprint-addon/blueprints'),
      ];

      // the first found addon blueprint should be the last one defined
      let expected = loadedBlueprintPaths.reverse();
      /*var first = */project.addonBlueprintLookupPaths();
      let second = project.addonBlueprintLookupPaths();

      expect(second).to.deep.equal(expected);
    });

    it('returns a listing of all blueprints paths', function() {
      let expected = [
        project.root + path.normalize('/blueprints'),
        project.root + path.normalize('/node_modules/ember-after-blueprint-addon/blueprints'),
        project.root + path.normalize('/node_modules/ember-random-addon/blueprints'),
        project.root + path.normalize('/node_modules/ember-before-blueprint-addon/blueprints'),
      ];

      expect(project.blueprintLookupPaths()).to.deep.equal(expected);
    });

    it('does not include blueprint path relative to root if outside a project', function() {
      project.isEmberCLIProject = function() {
        return false;
      };

      expect(project.blueprintLookupPaths()).to.deep.equal(project.addonBlueprintLookupPaths());
    });

    it('returns an instance of an addon with an object export', function() {
      let addons = project.addons;

      let addon = addons.find(a => a.name === 'ember-generated-with-export-addon');
      expect(addon instanceof Addon).to.equal(true);
    });

    it('adds the project itself if it is an addon', function() {
      project.addonPackages = {};
      project.isEmberCLIAddon = function() { return true; };

      project.discoverAddons();

      expect(project.addonPackages[project.name()]).to.exist;
    });

    it('should catch addon constructor errors', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/addon/invalid-constructor');
      packageContents = require(path.join(projectPath, 'package.json'));

      makeProject();

      const invalidAddonName = 'ember-invalid-addon';
      const expectedPath = path.join(projectPath, '/lib/', invalidAddonName);
      const expectedError = `An error occurred in the constructor for ${invalidAddonName} at ${expectedPath}`;

      expect(() => {
        project.initializeAddons();
      }).to.throw(expectedError);
    });
  });

  describe('reloadAddon', function() {
    beforeEach(function() {
      projectPath = path.resolve(__dirname, '../../fixtures/addon/simple');
      packageContents = require(path.join(projectPath, 'package.json'));

      makeProject();

      project.initializeAddons();

      td.replace(Project.prototype, 'initializeAddons', td.function());
      td.replace(Project.prototype, 'reloadPkg', td.function());

      project.reloadAddons();
    });

    afterEach(function() {
      td.reset();
    });

    it('sets _addonsInitialized to false', function() {
      expect(project._addonsInitialized).to.equal(false);
    });

    it('reloads the package', function() {
      td.verify(Project.prototype.reloadPkg(), { ignoreExtraArgs: true });
    });

    it('initializes the addons', function() {
      td.verify(Project.prototype.initializeAddons(), { ignoreExtraArgs: true });
    });
  });

  describe('reloadPkg', function() {
    let newProjectPath, oldPkg;
    beforeEach(function() {
      projectPath = path.resolve(__dirname, '../../fixtures/addon/simple');
      packageContents = require(path.join(projectPath, 'package.json'));

      makeProject();

      project.initializeAddons();

      newProjectPath = path.resolve(__dirname, '../../fixtures/addon/env-addons');
      oldPkg = project.pkg;

      project.root = newProjectPath;
    });

    it('reloads the package from disk', function() {
      project.reloadPkg();

      expect(oldPkg).to.not.deep.equal(project.pkg);
    });
  });

  describe('emberCLIVersion', function() {
    beforeEach(function() {
      projectPath = `${process.cwd()}/tmp/test-app`;
      makeProject();
    });

    it('should return the same value as the utility function', function() {
      expect(project.emberCLIVersion()).to.equal(emberCLIVersion());
    });
  });

  describe('isEmberCLIProject', function() {
    beforeEach(function() {
      projectPath = `${process.cwd()}/tmp/test-app`;

      makeProject();
    });

    it('returns false when `ember-cli` is not a dependency', function() {
      expect(project.isEmberCLIProject()).to.equal(false);
    });

    it('returns true when `ember-cli` is a devDependency', function() {
      project.pkg.devDependencies = { 'ember-cli': '*' };

      expect(project.isEmberCLIProject()).to.equal(true);
    });

    it('returns true when `ember-cli` is a dependency', function() {
      project.pkg.dependencies = { 'ember-cli': '*' };

      expect(project.isEmberCLIProject()).to.equal(true);
    });
  });

  describe('isEmberCLIAddon', function() {
    beforeEach(function() {
      projectPath = `${process.cwd()}/tmp/test-app`;

      makeProject();
      project.initializeAddons();
    });

    it('should return true if `ember-addon` is included in keywords', function() {
      project.pkg = {
        keywords: ['ember-addon'],
      };

      expect(project.isEmberCLIAddon()).to.equal(true);
    });

    it('should return false if `ember-addon` is not included in keywords', function() {
      project.pkg = {
        keywords: [],
      };

      expect(project.isEmberCLIAddon()).to.equal(false);
    });
  });

  if (experiments.MODULE_UNIFICATION) {
    describe('isModuleUnification', function() {
      beforeEach(function() {
        projectPath = `${process.cwd()}/tmp/test-app`;

        makeProject();
      });

      it('returns false when `./src` does not exist', function() {
        expect(project.isModuleUnification()).to.equal(false);
      });

      it('returns true when `./src` exists', function() {
        let srcPath = path.join(projectPath, 'src');
        fs.ensureDirSync(srcPath);

        expect(project.isModuleUnification()).to.equal(true);
      });
    });
  }

  describe('findAddonByName', function() {
    beforeEach(function() {
      projectPath = `${process.cwd()}/tmp/test-app`;

      makeProject();

      td.replace(Project.prototype, 'initializeAddons', td.function());

      project.addons = [{
        name: 'foo',
        pkg: { name: 'foo' },
      }, {
        pkg: { name: 'bar-pkg' },
      }, {
        name: 'foo-bar',
        pkg: { name: 'foo-bar' },
      }];
    });

    afterEach(function() {
      td.reset();
    });

    it('should call initialize addons', function() {
      project.findAddonByName('foo');
      td.verify(project.initializeAddons(), { ignoreExtraArgs: true });
    });

    it('generally should work and defer to findAddonByName utlity', function() {
      let addon;
      addon = project.findAddonByName('foo');
      expect(addon.name).to.equal('foo', 'should have found the foo addon');

      addon = project.findAddonByName('bar-pkg');
      expect(addon.pkg.name).to.equal('bar-pkg', 'should have found the bar-pkg addon');
    });
  });

  describe('bowerDirectory', function() {
    beforeEach(function() {
      projectPath = path.resolve(__dirname, '../../fixtures/addon/simple');
      makeProject();
    });

    it('should be initialized in constructor', function() {
      expect(project.bowerDirectory).to.equal('bower_components');
    });

    it('should be set to directory property in .bowerrc', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/bower-directory-tests/bowerrc-with-directory');
      makeProject();
      expect(project.bowerDirectory).to.equal('vendor');
    });

    it('should default to ‘bower_components’ unless directory property is set in .bowerrc', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/bower-directory-tests/bowerrc-without-directory');
      makeProject();
      expect(project.bowerDirectory).to.equal('bower_components');
    });

    it('should default to ‘bower_components’ if .bowerrc is not present', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/bower-directory-tests/no-bowerrc');
      makeProject();
      expect(project.bowerDirectory).to.equal('bower_components');
    });

    it('should default to ‘bower_components’ if .bowerrc json is invalid', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/bower-directory-tests/invalid-bowerrc');
      makeProject();
      expect(project.bowerDirectory).to.equal('bower_components');
    });
  });

  describe('.nullProject', function() {
    it('is a singleton', function() {
      expect(Project.nullProject()).to.equal(Project.nullProject());
    });
  });

  describe('generateTestFile()', function() {
    it('returns empty file and shows warning', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/project');
      makeProject();

      expect(project.generateTestFile()).to.equal('');
      expect(project.ui.output).to.contain('Please install an Ember.js test framework addon or update your dependencies.');
    });
  });
});
