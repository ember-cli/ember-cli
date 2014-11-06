'use strict';

var path    = require('path');
var Project = require('../../../lib/models/project');
var Addon   = require('../../../lib/models/addon');
var tmp     = require('../../helpers/tmp');
var touch   = require('../../helpers/file-utils').touch;
var assert  = require('assert');

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
      assert.equal(called, true);
    });

    it('configPath() returns tests/dummy/config/environment', function() {
      project.pkg = {
        'ember-addon': {
          'configPath': 'tests/dummy/config'
        }
      };

      var expected = path.normalize('tests/dummy/config/environment');

      assert.equal(project.configPath(), expected);
    });

    it('calls getAddonsConfig', function() {
      var addonConfigCalled = false;

      project.getAddonsConfig = function() {
        addonConfigCalled = true;

        return {};
      };

      project.config('development');
      assert.equal(addonConfigCalled, true);
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
          assert.deepEqual(actual, expected);
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
        assert.deepEqual(actual, expected);
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
        assert.deepEqual(actual, expected);
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
        'something-else': 'latest'
      };

      assert.deepEqual(project.dependencies(), expected);
    });

    it('returns a listing of all dependencies in the projects bower.json', function() {
      var expected = {
        'handlebars': '~1.3.0',
        'jquery': '^1.11.1',
        'ember': '1.7.0',
        'ember-data': '1.0.0-beta.10',
        'ember-resolver': '~0.1.7',
        'loader.js': 'stefanpenner/loader.js#1.0.1',
        'ember-cli-shims': 'stefanpenner/ember-cli-shims#0.0.3',
        'ember-cli-test-loader': 'rwjblue/ember-cli-test-loader#0.0.4',
        'ember-load-initializers': 'stefanpenner/ember-load-initializers#0.0.2',
        'ember-qunit': '0.1.8',
        'ember-qunit-notifications': '0.0.4',
        'qunit': '~1.15.0'
      };

      assert.deepEqual(project.bowerDependencies(), expected);
    });

    it('returns a listing of all ember-cli-addons', function() {
      var expected = [
        'tests-server-middleware',
        'history-support-middleware', 'serve-files-middleware',
        'proxy-server-middleware', 'ember-random-addon', 'ember-non-root-addon',
        'ember-generated-with-export-addon', 'ember-generated-no-export-addon',
        'ember-yagni', 'ember-ng', 'ember-super-button'
      ];

      project.buildAddonPackages();
      assert.deepEqual(Object.keys(project.addonPackages), expected);
    });

    it('returns an instance of the addon', function() {
      var addons = project.addons;

      assert.equal(addons[4].name, 'Ember Non Root Addon');
    });

    it('addons get passed the project instance', function() {
      var addons = project.addons;

      assert.equal(addons[1].project, project);
    });

    it('returns an instance of an addon that uses `ember-addon-main`', function() {
      var addons = project.addons;

      assert.equal(addons[5].name, 'Ember Random Addon');
    });

    it('returns the default blueprints path', function() {
      var expected = project.root + path.normalize('/blueprints');

      assert.equal(project.localBlueprintLookupPath(), expected);
    });

    it('returns a listing of all addon blueprints paths', function() {
      var expected = [project.root + path.normalize('/node_modules/ember-random-addon/blueprints')];

      assert.deepEqual(project.addonBlueprintLookupPaths(), expected);
    });

    it('returns a listing of all blueprints paths', function() {
      var expected = [
        project.root + path.normalize('/blueprints'),
        project.root + path.normalize('/node_modules/ember-random-addon/blueprints')
      ];

      assert.deepEqual(project.blueprintLookupPaths(), expected);
    });

    it('returns an empty list of blueprint paths if outside a project', function() {
      project.isEmberCLIProject = function() {
        return false;
      };

      assert.deepEqual(project.blueprintLookupPaths(), []);
    });

    it('returns an instance of an addon with an object export', function() {
      var addons = project.addons;

      assert.ok(addons[6] instanceof Addon);
      assert.equal(addons[6].name, 'Ember CLI Generated with export');
    });

    it('returns an instance of a generated addon with no export', function() {
      var addons = project.addons;

      assert.ok(addons[7] instanceof Addon);
      assert.equal(addons[7].name, '(generated ember-generated-no-export-addon addon)');
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

      assert.ok(added);
    });
  });

  describe('emberCLIVersion', function() {
    it('should return the same value as the utlity function', function() {
      assert.equal(project.emberCLIVersion(), emberCLIVersion());
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

      assert.equal(project.isEmberCLIAddon(), true);
    });

    it('should return false if `ember-addon` is not included in keywords', function() {
      project.pkg = {
        keywords: [ ]
      };

      assert.equal(project.isEmberCLIAddon(), false);
    });
  });

  describe('bowerDirectory', function() {
    it('should be initialized in constructor', function() {
      assert.equal(project.bowerDirectory, 'bower_components');
    });

    it('should be set to directory property in .bowerrc', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/bower-directory-tests/bowerrc-with-directory');
      project = new Project(projectPath, {});
      assert.equal(project.bowerDirectory, 'vendor');
    });

    it('should default to ‘bower_components’ unless directory property is set in .bowerrc', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/bower-directory-tests/bowerrc-without-directory');
      project = new Project(projectPath, {});
      assert.equal(project.bowerDirectory, 'bower_components');
    });

    it('should default to ‘bower_components’ if .bowerrc is not present', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/bower-directory-tests/no-bowerrc');
      project = new Project(projectPath, {});
      assert.equal(project.bowerDirectory, 'bower_components');
    });

    it('should default to ‘bower_components’ if .bowerrc json is invalid', function() {
      projectPath = path.resolve(__dirname, '../../fixtures/bower-directory-tests/invalid-bowerrc');
      project = new Project(projectPath, {});
      assert.equal(project.bowerDirectory, 'bower_components');
    });
  });
});
