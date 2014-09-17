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

    after(function() {
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
      var projectConfig, addonsConfig;

      beforeEach(function() {
        addonsConfig  = { addon: { derp: 'herp' } };
        projectConfig = { foo: 'bar', baz: 'qux' };

        project.getAddonsConfig = function() {
          return addonsConfig;
        };

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
            derp: 'herp'
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
            derp: 'herp'
          }
        };

        addonsConfig.foo = 'NO!!!!!!';

        var actual = project.config('development');
        assert.deepEqual(actual, expected);
      });
    });
  });

  describe('addons', function() {
    before(function() {
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

    it('returns a listing of all ember-cli-addons', function() {
      var expected = [
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

      assert.equal(addons[3].name, 'Ember Non Root Addon');
    });

    it('addons get passed the project instance', function() {
      var addons = project.addons;

      assert.equal(addons[0].project, project);
    });

    it('returns an instance of an addon that uses `ember-addon-main`', function() {
      var addons = project.addons;

      assert.equal(addons[4].name, 'Ember Random Addon');
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

      assert.ok(addons[5] instanceof Addon);
      assert.equal(addons[5].name, 'Ember CLI Generated with export');
    });

    it('returns an instance of a generated addon with no export', function() {
      var addons = project.addons;

      assert.ok(addons[6] instanceof Addon);
      assert.equal(addons[6].name, '(generated ember-generated-no-export-addon addon)');
    });
  });

  describe('emberCLIVersion', function() {
    it('should return the same value as the utlity function', function() {
      assert.equal(project.emberCLIVersion(), emberCLIVersion());
    });
  });

  describe('isEmberCLIAddon', function() {
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
});
