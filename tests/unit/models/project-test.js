'use strict';

var path            = require('path');
var Project         = require('../../../lib/models/project');
var Addon           = require('../../../lib/models/addon');
var tmp             = require('../../helpers/tmp');
var touch           = require('../../helpers/file-utils').touch;
var expect          = require('chai').expect;
var MockUI          = require('../../helpers/mock-ui');
var emberCLIVersion = require('../../../lib/utilities/version-utils').emberCLIVersion;
var td = require('testdouble')

describe('models/project.js', function() {
  var project, projectPath, tmpPath;

  afterEach(function() {
    if (project) { project = null; }
  });

  describe('Project.prototype.config', function() {
    var called;

    beforeEach(function() {
      projectPath = 'tmp/test-app';
      called = false;
      return tmp.setup(projectPath)
        .then(function() {
          touch(projectPath + '/config/environment.js', {
            baseURL: '/foo/bar'
          });

          project = new Project(projectPath, { }, new MockUI());
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

    it('configPath() returns tests/dummy/config/environment', function() {
      project.pkg = {
        'ember-addon': {
          'configPath': 'tests/dummy/config'
        }
      };

      var expected = path.normalize('tests/dummy/config/environment');

      expect(project.configPath().slice(-expected.length)).to.equal(expected);
    });

    it('calls getAddonsConfig', function() {
      var addonConfigCalled = false;

      project.getAddonsConfig = function() {
        addonConfigCalled = true;

        return {};
      };

      project.config('development');
      expect(addonConfigCalled).to.equal(true);
    });

    it('returns getAddonsConfig result when configPath is not present', function() {
      var expected = {
        foo: 'bar'
      };

      project.getAddonsConfig = function() {
        return expected;
      };

      var actual = project.config('development');
      expect(actual).to.deep.equal(expected);
    });

    describe('merges getAddonsConfig result with app config', function() {
      var projectConfig, addon1Config, addon2Config;

      beforeEach(function() {
        addon1Config  = { addon: { derp: 'herp' } };
        addon2Config  = { addon: { blammo: 'blahzorz' } };

        projectConfig = { foo: 'bar', baz: 'qux' };
        project.addons = [
          { config: function() { return addon1Config; }},
          { config: function() { return addon2Config; }}
        ];

        project._addonsInitialized = true;

        project.require = function() {
          return function() {
            return projectConfig;
          };
        };
      });

      it('merges getAddonsConfig result with app config', function() {
        var expected = {
          foo: 'bar',
          baz: 'qux',
          addon: {
            derp: 'herp',
            blammo: 'blahzorz'
          }
        };

        var actual = project.config('development');
        expect(actual).to.deep.equal(expected);
      });

      it('getAddonsConfig does NOT override project config', function() {
        var expected = {
          foo: 'bar',
          baz: 'qux',
          addon: {
            derp: 'herp',
            blammo: 'blahzorz'
          }
        };

        addon1Config.foo = 'NO!!!!!!';

        var actual = project.config('development');
        expect(actual).to.deep.equal(expected);
      });
    });
  });

  describe('addons', function() {
    beforeEach(function() {
      projectPath = path.resolve(__dirname, '../../fixtures/addon/simple');
      var packageContents = require(path.join(projectPath, 'package.json'));

      project = new Project(projectPath, packageContents, new MockUI());
      project.initializeAddons();
    });

    it('returns a listing of all dependencies in the project\'s package.json', function() {
      var expected = {
        'ember-cli': 'latest',
        'ember-random-addon': 'latest',
        'ember-resolver': '^2.0.2',
        'ember-non-root-addon': 'latest',
        'ember-generated-with-export-addon': 'latest',
        'non-ember-thingy': 'latest',
        'ember-before-blueprint-addon': 'latest',
        'ember-after-blueprint-addon': 'latest',
        'something-else': 'latest',
        'ember-devDeps-addon': 'latest',
        'ember-addon-with-dependencies': 'latest',
        'loader.js': 'latest'
      };

      expect(project.dependencies()).to.deep.equal(expected);
    });

    it('returns a listing of all dependencies in the project\'s bower.json', function() {
      var expected = {
        'jquery': '^1.11.1',
        'ember': '1.7.0',
        'ember-data': '1.0.0-beta.10',
        'ember-cli-shims': 'ember-cli/ember-cli-shims#0.0.3',
        'ember-qunit': '0.1.8',
        'qunit': '~1.15.0'
      };

      expect(project.bowerDependencies()).to.deep.equal(expected);
    });

    it('returns a listing of all ember-cli-addons directly depended on by the project', function() {
      var expected = [
        'testem-url-rewriter-middleware',
        'tests-server-middleware',
        'history-support-middleware', 'serve-files-middleware',
        'proxy-server-middleware', 'ember-cli-legacy-blueprints', 'ember-try',
        'ember-random-addon', 'ember-non-root-addon',
        'ember-generated-with-export-addon',
        'ember-before-blueprint-addon', 'ember-after-blueprint-addon',
        'ember-devDeps-addon', 'ember-addon-with-dependencies', 'ember-super-button'
      ];
      expect(Object.keys(project.addonPackages)).to.deep.equal(expected);
    });

    it('returns instances of the addons', function() {
      var addons = project.addons;

      expect(addons[8].name).to.equal('Ember Non Root Addon');
      expect(addons[14].name).to.equal('Ember Super Button');
      expect(addons[14].addons[0].name).to.equal('Ember Yagni');
      expect(addons[14].addons[1].name).to.equal('Ember Ng');
    });

    it('addons get passed the project instance', function() {
      var addons = project.addons;

      expect(addons[1].project).to.equal(project);
    });

    it('returns an instance of an addon that uses `ember-addon-main`', function() {
      var addons = project.addons;

      expect(addons[10].name).to.equal('Ember Random Addon');
    });

    it('returns the default blueprints path', function() {
      var expected = project.root + path.normalize('/blueprints');

      expect(project.localBlueprintLookupPath()).to.equal(expected);
    });

    it('returns a listing of all addon blueprints paths ordered by last loaded when called once', function() {
      var loadedBlueprintPaths = [
        process.cwd() + path.normalize('/node_modules/ember-cli-legacy-blueprints/blueprints'),
        project.root + path.normalize('/node_modules/ember-before-blueprint-addon/blueprints'),
        project.root + path.normalize('/node_modules/ember-random-addon/blueprints'),
        project.root + path.normalize('/node_modules/ember-after-blueprint-addon/blueprints')
      ];

      // the first found addon blueprint should be the last one defined
      var expected = loadedBlueprintPaths.reverse();
      var first = project.addonBlueprintLookupPaths();

      expect(first).to.deep.equal(expected);
    });

    it('returns a listing of all addon blueprints paths ordered by last loaded when called twice', function() {
      var loadedBlueprintPaths = [
        process.cwd() + path.normalize('/node_modules/ember-cli-legacy-blueprints/blueprints'),
        project.root + path.normalize('/node_modules/ember-before-blueprint-addon/blueprints'),
        project.root + path.normalize('/node_modules/ember-random-addon/blueprints'),
        project.root + path.normalize('/node_modules/ember-after-blueprint-addon/blueprints')
      ];

      // the first found addon blueprint should be the last one defined
      var expected = loadedBlueprintPaths.reverse();
      /*var first = */project.addonBlueprintLookupPaths();
      var second = project.addonBlueprintLookupPaths();

      expect(second).to.deep.equal(expected);
    });

    it('returns a listing of all blueprints paths', function() {
      var expected = [
        project.root + path.normalize('/blueprints'),
        project.root + path.normalize('/node_modules/ember-after-blueprint-addon/blueprints'),
        project.root + path.normalize('/node_modules/ember-random-addon/blueprints'),
        project.root + path.normalize('/node_modules/ember-before-blueprint-addon/blueprints'),
        process.cwd() + path.normalize('/node_modules/ember-cli-legacy-blueprints/blueprints')
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
      var addons = project.addons;

      expect(addons[7] instanceof Addon).to.equal(true);
      expect(addons[7].name).to.equal('Ember CLI Generated with export');
    });

    it('adds the project itself if it is an addon', function() {
      var added = false;
      project.addonPackages = {};
      project.isEmberCLIAddon = function() { return true; };

      project.addonDiscovery.discoverAtPath = function(path) {
        if (path === project.root) {
          added = true;
        }
      };

      project.discoverAddons();

      expect(added).to.be.ok;
    });
  });

  describe('reloadAddon', function() {
    beforeEach(function() {
      projectPath         = path.resolve(__dirname, '../../fixtures/addon/simple');
      var packageContents = require(path.join(projectPath, 'package.json'));

      project = new Project(projectPath, packageContents, new MockUI());
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
      td.verify(Project.prototype.reloadPkg(), {ignoreExtraArgs: true});
    });

    it('initializes the addons', function() {
      td.verify(Project.prototype.initializeAddons(), {ignoreExtraArgs: true});
    });
  });

  describe('reloadPkg', function() {
    var newProjectPath, oldPkg;
    beforeEach(function() {
      projectPath         = path.resolve(__dirname, '../../fixtures/addon/simple');
      var packageContents = require(path.join(projectPath, 'package.json'));

      project = new Project(projectPath, packageContents, new MockUI());
      project.initializeAddons();

      newProjectPath = path.resolve(__dirname, '../../fixtures/addon/env-addons');
      oldPkg         = project.pkg;

      project.root = newProjectPath;
    });

    it('reloads the package from disk', function() {
      project.reloadPkg();

      expect(oldPkg).to.not.deep.equal(project.pkg);
    });
  });

  describe('emberCLIVersion', function() {
    beforeEach(function() {
      projectPath = process.cwd() + '/tmp/test-app';
      project = new Project(projectPath, {}, new MockUI());
    });

    it('should return the same value as the utility function', function() {
      expect(project.emberCLIVersion()).to.equal(emberCLIVersion());
    });
  });

  describe('isEmberCLIProject', function() {
    beforeEach(function() {
      projectPath = process.cwd() + '/tmp/test-app';
      project = new Project(projectPath, {}, new MockUI());
    });

    it('returns false when `ember-cli` is not a dependency', function() {
      expect(project.isEmberCLIProject()).to.equal(false);
    });

    it('returns true when `ember-cli` is a devDependency', function() {
      project.pkg.devDependencies = {'ember-cli': '*'};

      expect(project.isEmberCLIProject()).to.equal(true);
    });

    it('returns true when `ember-cli` is a dependency', function() {
      project.pkg.dependencies = {'ember-cli': '*'};

      expect(project.isEmberCLIProject()).to.equal(true);
    });
  });

  describe('isEmberCLIAddon', function() {
    beforeEach(function() {
      projectPath = process.cwd() + '/tmp/test-app';

      project = new Project(projectPath, {}, new MockUI());
      project.initializeAddons();
    });

    it('should return true if `ember-addon` is included in keywords', function() {
      project.pkg = {
        keywords: [ 'ember-addon' ]
      };

      expect(project.isEmberCLIAddon()).to.equal(true);
    });

    it('should return false if `ember-addon` is not included in keywords', function() {
      project.pkg = {
        keywords: [ ]
      };

      expect(project.isEmberCLIAddon()).to.equal(false);
    });
  });

  describe('findAddonByName', function() {
    beforeEach(function() {
      projectPath = process.cwd() + '/tmp/test-app';

      project = new Project(projectPath, {}, new MockUI());

      td.replace(Project.prototype, 'initializeAddons', td.function());

      project.addons = [{
        name: 'foo',
        pkg: { name: 'foo' }
      }, {
        pkg: { name: 'bar-pkg' }
      }, {
        name: 'foo-bar',
        pkg: { name: 'foo-bar' }
      }];
    });

    afterEach(function() {
      td.reset();
    });

    it('should call initialize addons', function() {
      project.findAddonByName('foo');
      td.verify(project.initializeAddons(), {ignoreExtraArgs: true});
    });

    it('should return the foo addon from name', function() {
      var addon = project.findAddonByName('foo');
      expect(addon.name).to.equal('foo', 'should have found the foo addon');
    });

    it('should return the foo-bar addon from name when a foo also exists', function() {
      var addon = project.findAddonByName('foo-bar');
      expect(addon.name).to.equal('foo-bar', 'should have found the foo-bar addon');
    });

    it('should return the bar-pkg addon from package name', function() {
      var addon = project.findAddonByName('bar-pkg');
      expect(addon.pkg.name).to.equal('bar-pkg', 'should have found the bar-pkg addon');
    });

    it('should return undefined if addon doesn\'t exist', function() {
      var addon = project.findAddonByName('not-an-addon');
      expect(addon).to.equal(undefined, 'not found addon should be undefined');
    });

    it('should not return an addon that is a substring of requested name', function() {
      var addon = project.findAddonByName('foo-ba');
      expect(addon).to.equal(undefined, 'foo-ba should not be found');
    });

    it('should not guess addon name from string with slashes', function() {
      var addon = project.findAddonByName('qux/foo');
      expect(addon).to.equal(undefined, 'should not have found the foo addon');
    })
  });

  describe('bowerDirectory', function() {
    beforeEach(function() {
      projectPath = path.resolve(__dirname, '../../fixtures/addon/simple');
      project = new Project(projectPath, {}, new MockUI());
    });

    it('should be initialized in constructor', function() {
      expect(project.bowerDirectory).to.equal('bower_components');
    });

    it('should be set to directory property in .bowerrc', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/bower-directory-tests/bowerrc-with-directory');
      project = new Project(projectPath, {}, new MockUI());
      expect(project.bowerDirectory).to.equal('vendor');
    });

    it('should default to ‘bower_components’ unless directory property is set in .bowerrc', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/bower-directory-tests/bowerrc-without-directory');
      project = new Project(projectPath, {}, new MockUI());
      expect(project.bowerDirectory).to.equal('bower_components');
    });

    it('should default to ‘bower_components’ if .bowerrc is not present', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/bower-directory-tests/no-bowerrc');
      project = new Project(projectPath, {}, new MockUI());
      expect(project.bowerDirectory).to.equal('bower_components');
    });

    it('should default to ‘bower_components’ if .bowerrc json is invalid', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/bower-directory-tests/invalid-bowerrc');
      project = new Project(projectPath, {}, new MockUI());
      expect(project.bowerDirectory).to.equal('bower_components');
    });
  });

  describe('nodeModulesPath', function() {
    function makeProject() {
      projectPath = path.resolve(__dirname, '../../fixtures/addon/simple');
      project = new Project(projectPath, {}, new MockUI());
    }

    afterEach(function() {
      delete process.env.EMBER_NODE_PATH;
    });

    it('should equal env.EMBER_NODE_PATH when it is set', function() {
      var nodePath = '/my/path/node_modules';
      process.env.EMBER_NODE_PATH = nodePath;

      makeProject();

      expect(project.nodeModulesPath).to.equal(path.resolve(nodePath));
    });

    it('should equal project.root joined with "node_modules" when EMBER_NODE_PATH is not set', function() {
      makeProject();

      expect(project.nodeModulesPath).to.equal(path.join(projectPath, 'node_modules'));
    });
  });

  describe('.nullProject', function() {
    it('is a singleton', function() {
      expect(Project.nullProject()).to.equal(Project.nullProject());
    });
  });

  describe('generateTestFile()', function() {
    it('returns empty file and shows warning', function() {
      var ui = new MockUI();

      projectPath = path.resolve(__dirname, '../../fixtures/project');
      project = new Project(projectPath, {}, ui);

      expect(project.generateTestFile()).to.equal('');
      expect(ui.output).to.contain('Please install an Ember.js test framework addon or update your dependencies.');
    });
  });
});
