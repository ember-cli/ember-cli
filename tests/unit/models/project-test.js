'use strict';

var path    = require('path');
var Project = require('../../../lib/models/project');
var Addon   = require('../../../lib/models/addon');
var stub    = require('../../helpers/stub').stub;
var tmp     = require('../../helpers/tmp');
var touch   = require('../../helpers/file-utils').touch;
var expect  = require('chai').expect;

var emberCLIVersion = require('../../../lib/utilities/ember-cli-version');

describe('models/project.js', function() {
  var project, projectPath;

  describe('Project.prototype.config', function() {
    var called      = false;

    beforeEach(function() {
      projectPath = process.cwd() + '/tmp/test-app';
      called = false;
      return tmp.setup(projectPath)
        .then(function() {
          touch(projectPath + '/config/environment.js', {
            baseURL: '/foo/bar'
          });

          project = new Project(projectPath, { });
          project.require = function() {
            called = true;
            return function() {};
          };
        });
    });

    afterEach(function() {
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

      expect(project.configPath()).to.equal(expected);
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

      return tmp.setup(projectPath) // ensure no config/environment.js is present
        .then(function() {
          project.getAddonsConfig = function() {
            return expected;
          };

          var actual = project.config('development');
          expect(actual).to.deep.equal(expected);
        });
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

      project = new Project(projectPath, packageContents);
      project.initializeAddons();
    });

    it('returns a listing of all dependencies in the projects package.json', function() {
      var expected = {
        'ember-cli': 'latest',
        'ember-random-addon': 'latest',
        'ember-non-root-addon': 'latest',
        'ember-generated-with-export-addon': 'latest',
        'ember-generated-no-export-addon': 'latest',
        'non-ember-thingy': 'latest',
        'ember-before-blueprint-addon': 'latest',
        'ember-after-blueprint-addon': 'latest',
        'something-else': 'latest',
        'ember-devDeps-addon': 'latest'
      };

      expect(project.dependencies()).to.deep.equal(expected);
    });

    it('returns a listing of all dependencies in the projects bower.json', function() {
      var expected = {
        'handlebars': '~1.3.0',
        'jquery': '^1.11.1',
        'ember': '1.7.0',
        'ember-data': '1.0.0-beta.10',
        'ember-resolver': '~0.1.7',
        'loader.js': 'ember-cli/loader.js#1.0.1',
        'ember-cli-shims': 'ember-cli/ember-cli-shims#0.0.3',
        'ember-cli-test-loader': 'rwjblue/ember-cli-test-loader#0.0.4',
        'ember-load-initializers': 'ember-cli/ember-load-initializers#0.0.2',
        'ember-qunit': '0.1.8',
        'ember-qunit-notifications': '0.0.4',
        'qunit': '~1.15.0'
      };

      expect(project.bowerDependencies()).to.deep.equal(expected);
    });

    it('returns a listing of all ember-cli-addons', function() {
      var expected = [
        'tests-server-middleware',
        'history-support-middleware', 'serve-files-middleware',
        'proxy-server-middleware', 'ember-random-addon', 'ember-non-root-addon',
        'ember-generated-with-export-addon', 'ember-generated-no-export-addon',
        'ember-before-blueprint-addon', 'ember-after-blueprint-addon',
        'ember-devDeps-addon', 'ember-yagni', 'ember-ng', 'ember-super-button'
      ];

      project.buildAddonPackages();
      expect(Object.keys(project.addonPackages)).to.deep.equal(expected);
    });

    it('returns an instance of the addon', function() {
      var addons = project.addons;

      expect(addons[6].name).to.equal('Ember Non Root Addon');
    });

    it('addons get passed the project instance', function() {
      var addons = project.addons;

      expect(addons[1].project).to.equal(project);
    });

    it('returns an instance of an addon that uses `ember-addon-main`', function() {
      var addons = project.addons;

      expect(addons[8].name).to.equal('Ember Random Addon');
    });

    it('returns the default blueprints path', function() {
      var expected = project.root + path.normalize('/blueprints');

      expect(project.localBlueprintLookupPath()).to.equal(expected);
    });

    it('returns a listing of all addon blueprints paths ordered by last loaded', function() {
      var loadedBlueprintPaths = [
        project.root + path.normalize('/node_modules/ember-before-blueprint-addon/blueprints'),
        project.root + path.normalize('/node_modules/ember-random-addon/blueprints'),
        project.root + path.normalize('/node_modules/ember-after-blueprint-addon/blueprints')
      ];

      // the first found addon blueprint should be the last one defined
      var expected = loadedBlueprintPaths.reverse();

      expect(project.addonBlueprintLookupPaths()).to.deep.equal(expected);
    });

    it('returns a listing of all blueprints paths', function() {
      var expected = [
        project.root + path.normalize('/blueprints'),
        project.root + path.normalize('/node_modules/ember-after-blueprint-addon/blueprints'),
        project.root + path.normalize('/node_modules/ember-random-addon/blueprints'),
        project.root + path.normalize('/node_modules/ember-before-blueprint-addon/blueprints')
      ];

      expect(project.blueprintLookupPaths()).to.deep.equal(expected);
    });

    it('returns an empty list of blueprint paths if outside a project', function() {
      project.isEmberCLIProject = function() {
        return false;
      };

      expect(project.blueprintLookupPaths()).to.deep.equal([]);
    });

    it('returns an instance of an addon with an object export', function() {
      var addons = project.addons;

      expect(addons[4] instanceof Addon).to.equal(true);
      expect(addons[4].name).to.equal('Ember CLI Generated with export');
    });

    it('returns an instance of a generated addon with no export', function() {
      var addons = project.addons;

      expect(addons[5] instanceof Addon).to.equal(true);
      expect(addons[5].name).to.equal('(generated ember-generated-no-export-addon addon)');
    });

    it('adds the project itself if it is an addon', function() {
      var added = false;
      project.addonPackages = {};
      project.isEmberCLIAddon = function() { return true; };

      project.addIfAddon = function(path) {
        if (path === project.root) {
          added = true;
        }
      };

      project.buildAddonPackages();

      expect(added);
    });


  });

  describe('reloadAddon', function() {
    beforeEach(function() {
      projectPath         = path.resolve(__dirname, '../../fixtures/addon/simple');
      var packageContents = require(path.join(projectPath, 'package.json'));

      project = new Project(projectPath, packageContents);
      project.initializeAddons();

      stub(Project.prototype, 'initializeAddons');
      stub(Project.prototype, 'reloadPkg');

      project.reloadAddons();
    });

    afterEach(function() {
      Project.prototype.initializeAddons.restore();
      Project.prototype.reloadPkg.restore();
    });

    it('sets _addonsInitialized to false', function() {
      expect(project._addonsInitialized).to.equal(false);
    });

    it('reloads the package', function() {
      expect(Project.prototype.reloadPkg.called, 'reloadPkg was called');
    });

    it('initializes the addons', function() {
      expect(Project.prototype.initializeAddons.called, 'initialize addons was called');
    });
  });

  describe('reloadPkg', function() {
    var newProjectPath, oldPkg;
    beforeEach(function() {
      projectPath         = path.resolve(__dirname, '../../fixtures/addon/simple');
      var packageContents = require(path.join(projectPath, 'package.json'));

      project = new Project(projectPath, packageContents);
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
    it('should return the same value as the utlity function', function() {
      expect(project.emberCLIVersion()).to.equal(emberCLIVersion());
    });
  });

  describe('isEmberCLIAddon', function() {
    beforeEach(function() {
      projectPath = process.cwd() + '/tmp/test-app';

      project = new Project(projectPath, {});
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

      project = new Project(projectPath, {});

      stub(Project.prototype, 'initializeAddons');

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
      Project.prototype.initializeAddons.restore();
    });

    it('should call initialize addons', function() {
      project.findAddonByName('foo');
      expect(project.initializeAddons.called, 'should have called initializeAddons');
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

    it('should return undefined if adddon doesn\'t exist', function() {
      var addon = project.findAddonByName('not-an-addon');
      expect(addon).to.equal(undefined, 'not found addon should be undefined');
    });
  });

  describe('bowerDirectory', function() {
    it('should be initialized in constructor', function() {
      expect(project.bowerDirectory).to.equal('bower_components');
    });

    it('should be set to directory property in .bowerrc', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/bower-directory-tests/bowerrc-with-directory');
      project = new Project(projectPath, {});
      expect(project.bowerDirectory).to.equal('vendor');
    });

    it('should default to ‘bower_components’ unless directory property is set in .bowerrc', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/bower-directory-tests/bowerrc-without-directory');
      project = new Project(projectPath, {});
      expect(project.bowerDirectory).to.equal('bower_components');
    });

    it('should default to ‘bower_components’ if .bowerrc is not present', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/bower-directory-tests/no-bowerrc');
      project = new Project(projectPath, {});
      expect(project.bowerDirectory).to.equal('bower_components');
    });

    it('should default to ‘bower_components’ if .bowerrc json is invalid', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/bower-directory-tests/invalid-bowerrc');
      project = new Project(projectPath, {});
      expect(project.bowerDirectory).to.equal('bower_components');
    });
  });
});
