'use strict';

const path = require('path');
const expect = require('chai').expect;
const Project = require('../../../lib/models/project');
const AddonDiscovery = require('../../../lib/models/addon-discovery');
let fixturePath = path.resolve(__dirname, '../../fixtures/addon');
const MockUI = require('console-ui/mock');
const MockCLI = require('../../helpers/mock-cli');
const fs = require('fs');

describe('models/addon-discovery.js', function() {
  let project, projectPath, ui;
  this.timeout(40000);

  beforeEach(function() {
    ui = new MockUI();
    projectPath = path.resolve(fixturePath, 'simple');
    const packageContents = require(path.join(projectPath, 'package.json'));
    let cli = new MockCLI({ ui });

    project = new Project(projectPath, packageContents, ui, cli);
  });

  describe('dependencies', function() {
    let mockPkg, deps, devDeps;

    beforeEach(function() {
      deps = {
        'foo-bar': 'latest',
        'blah-blah': '1.0.0',
      };

      devDeps = {
        'dev-foo-bar': 'latest',
      };

      mockPkg = {
        dependencies: deps,
        devDependencies: devDeps,
      };
    });

    it('returns an object containing dependencies from the provided package.json', function() {
      let expected = Object.assign({}, deps, devDeps);
      let discovery = new AddonDiscovery(ui);

      expect(discovery.dependencies(mockPkg)).to.deep.equal(expected);
    });

    it('excludes development dependencies if instructed', function() {
      let expected = Object.assign({}, deps);
      let discovery = new AddonDiscovery(ui);

      expect(discovery.dependencies(mockPkg, true)).to.deep.equal(expected);
    });
  });

  describe('discoverFromInternalProjectAddons', function() {
    it('calls discoverAtPath for each path in project.supportedInternalAddonPaths', function() {
      let actualPaths = [];
      let project = {
        supportedInternalAddonPaths() {
          return ['lib/foo/', 'baz/qux/'];
        },
      };

      let discovery = new AddonDiscovery(ui);

      discovery.discoverAtPath = function(path) {
        actualPaths.push(path);
      };

      discovery.discoverFromInternalProjectAddons(project);

      expect(actualPaths).to.deep.equal(project.supportedInternalAddonPaths());
    });
  });

  describe('discoverInRepoAddons', function() {
    describe('returns empty array when ember-addon.paths is empty', function() {
      let discovery, pkg;

      beforeEach(function() {
        discovery = new AddonDiscovery(ui);
      });

      it('returns empty array if `ember-addon` is not present in provided package', function() {
        pkg = { };

        let actual = discovery.discoverInRepoAddons(fixturePath, pkg);
        expect(actual).to.deep.equal([]);
      });

      it('returns empty array if `ember-addon.paths` is missing in provided package', function() {
        pkg = {
          'ember-addon': { },
        };

        let actual = discovery.discoverInRepoAddons(fixturePath, pkg);
        expect(actual).to.deep.equal([]);
      });

      it('returns empty array if `ember-addon.paths` is empty in provided package', function() {
        pkg = {
          'ember-addon': {
            paths: [],
          },
        };

        let actual = discovery.discoverInRepoAddons(fixturePath, pkg);
        expect(actual).to.deep.equal([]);
      });
    });

    it('calls discoverAtPath for each path in ember-addon.paths', function() {
      let actualPaths = [];
      let pkg = {
        'ember-addon': {
          paths: ['lib/foo', 'baz/qux'],
        },
      };
      let discovery = new AddonDiscovery(ui);

      discovery.discoverAtPath = function(providedPath) {
        actualPaths.push(providedPath);

        return providedPath;
      };

      discovery.discoverInRepoAddons(fixturePath, pkg);

      let expected = [
        path.join(fixturePath, 'lib', 'foo'),
        path.join(fixturePath, 'baz', 'qux'),
      ];

      expect(actualPaths).to.deep.equal(expected);
    });

    it('falsey results from discoverAtPath are filtered out', function() {
      let actualPaths = [];
      let pkg = {
        'ember-addon': {
          paths: ['lib/foo', 'baz/qux'],
        },
      };
      let discovery = new AddonDiscovery(ui);

      discovery.discoverAtPath = function(providedPath) {
        actualPaths.push(providedPath);

        return null;
      };

      let result = discovery.discoverInRepoAddons(fixturePath, pkg);

      let expectedPaths = [
        path.join(fixturePath, 'lib', 'foo'),
        path.join(fixturePath, 'baz', 'qux'),
      ];

      expect(actualPaths).to.deep.equal(expectedPaths);
      expect(result).to.deep.equal([]);
    });
  });

  describe('discoverFromDependencies', function() {
    let mockPkg, deps, devDeps;

    beforeEach(function() {
      deps = {
        'foo-bar': 'latest',
        'blah-blah': '1.0.0',
      };

      devDeps = {
        'dev-foo-bar': 'latest',
      };

      mockPkg = {
        dependencies: deps,
        devDependencies: devDeps,
      };
    });

    it('can find a package without a main entry point [DEPRECATED]', function() {
      let root = path.join(fixturePath, 'shared-package', 'base');
      let actualPaths = [];
      let discovery = new AddonDiscovery(ui);

      deps['invalid-package'] = 'latest';
      discovery.discoverAtPath = function(providedPath) {
        actualPaths.push(providedPath);

        return providedPath;
      };

      discovery.discoverFromDependencies(root, mockPkg, true);

      let expectedPaths = [
        path.join(root, 'node_modules', 'foo-bar'),
        path.join(root, 'node_modules', 'blah-blah'),
        path.join(root, 'node_modules', 'invalid-package'),
      ];

      expect(actualPaths).to.deep.equal(expectedPaths);
    });

    it('does not error when dependencies are not found', function() {
      let root = path.join(fixturePath, 'shared-package', 'base');
      let actualPaths = [];
      let discovery = new AddonDiscovery(ui);

      deps['blah-zorz'] = 'latest';
      discovery.discoverAtPath = function(providedPath) {
        actualPaths.push(providedPath);

        return providedPath;
      };

      discovery.discoverFromDependencies(root, mockPkg, true);

      let expectedPaths = [
        path.join(root, 'node_modules', 'foo-bar'),
        path.join(root, 'node_modules', 'blah-blah'),
      ];

      expect(actualPaths).to.deep.equal(expectedPaths);
    });

    it('calls discoverAtPath for each entry in dependencies', function() {
      let root = path.join(fixturePath, 'shared-package', 'base');
      let actualPaths = [];
      let discovery = new AddonDiscovery(ui);

      discovery.discoverAtPath = function(providedPath) {
        actualPaths.push(providedPath);

        return providedPath;
      };

      discovery.discoverFromDependencies(root, mockPkg);

      let expectedPaths = [
        path.join(root, '..', 'node_modules', 'dev-foo-bar'),
        path.join(root, 'node_modules', 'foo-bar'),
        path.join(root, 'node_modules', 'blah-blah'),
      ];

      expect(actualPaths).to.deep.equal(expectedPaths);
    });

    it('excludes devDeps if `excludeDevDeps` is true', function() {
      let root = path.join(fixturePath, 'shared-package', 'base');
      let actualPaths = [];
      let discovery = new AddonDiscovery(ui);

      discovery.discoverAtPath = function(providedPath) {
        actualPaths.push(providedPath);

        return providedPath;
      };

      discovery.discoverFromDependencies(root, mockPkg, true);

      let expectedPaths = [
        path.join(root, 'node_modules', 'foo-bar'),
        path.join(root, 'node_modules', 'blah-blah'),
      ];

      expect(actualPaths).to.deep.equal(expectedPaths);
    });
  });

  describe('discoverFromProjectItself', function() {
    it('adds the project.root if it is an addon', function() {
      let project = {
        isEmberCLIAddon() {
          return false;
        },
      };

      let discovery = new AddonDiscovery(ui);
      let actual = discovery.discoverFromProjectItself(project);

      expect(actual).to.deep.equal([]);
    });

    it('returns the root path if the project is an addon', function() {
      let actualPaths = [];
      let project = {
        root: 'foo/bar/baz',
        isEmberCLIAddon() {
          return true;
        },
      };

      let discovery = new AddonDiscovery(ui);

      discovery.discoverAtPath = function(providedPath) {
        actualPaths.push(providedPath);

        return providedPath;
      };

      let actual = discovery.discoverFromProjectItself(project);
      let expectedPaths = ['foo/bar/baz'];

      expect(actualPaths).to.deep.equal(expectedPaths);
      expect(actual).to.deep.equal(expectedPaths);
    });
  });

  describe('discoverChildAddons', function() {
    let addon, discovery, discoverFromDependenciesCalled, discoverInRepoAddonsCalled;

    beforeEach(function() {
      addon = {
        name: 'awesome-sauce',
        root: fixturePath,
        pkg: {
          dependencies: {
            'foo-bar': 'latest',
          },
          devDependencies: {
            'dev-dep-bar': 'latest',
          },
        },
      };

      discovery = new AddonDiscovery(ui);

      discovery.discoverFromDependencies = function() {
        discoverFromDependenciesCalled = true;

        return [];
      };

      discovery.discoverInRepoAddons = function() {
        discoverInRepoAddonsCalled = true;

        return [];
      };
    });

    it('delegates to discoverInRepoAddons and discoverFromDependencies', function() {
      discovery.discoverChildAddons(addon);

      expect(discoverInRepoAddonsCalled).to.equal(true);
      expect(discoverFromDependenciesCalled).to.equal(true);
    });

    it('concats discoverInRepoAddons and discoverFromDependencies results', function() {
      discovery.discoverFromDependencies = function() {
        return ['discoverFromDependencies'];
      };

      discovery.discoverInRepoAddons = function() {
        return ['discoverInRepoAddons'];
      };

      let result = discovery.discoverChildAddons(addon);

      expect(result).to.deep.equal(['discoverFromDependencies', 'discoverInRepoAddons']);
    });

    it('uses shouldIncludeChildAddon() to determine whether an addon should be included', function() {
      addon.shouldIncludeChildAddon = function(childAddon) {
        return childAddon === 'discoverFromDependencies';
      };

      discovery.discoverFromDependencies = function() {
        return ['discoverFromDependencies'];
      };

      discovery.discoverInRepoAddons = function() {
        return ['discoverInRepoAddons'];
      };

      let result = discovery.discoverChildAddons(addon);
      expect(result.length).to.equal(1);
      expect(result[0]).to.equal('discoverFromDependencies');
    });
  });

  describe('discoverProjectAddons', function() {
    let discovery, discoverFromProjectItselfCalled, discoverFromInternalProjectAddonsCalled, discoverFromDependenciesCalled, discoverInRepoAddonsCalled;

    beforeEach(function() {
      let cli = new MockCLI();
      let packageContents = {
        dependencies: {
          'foo-bar': 'latest',
        },
        devDependencies: {
          'dev-dep-bar': 'latest',
        },
      };

      project = new Project(fixturePath, packageContents, cli.ui, cli);

      discovery = new AddonDiscovery(cli.ui);

      discovery.discoverFromProjectItself = function() {
        discoverFromProjectItselfCalled = true;

        return ['discoverFromProjectItself'];
      };

      discovery.discoverFromInternalProjectAddons = function() {
        discoverFromInternalProjectAddonsCalled = true;

        return ['discoverFromInternalProjectAddons'];
      };

      discovery.discoverFromDependencies = function() {
        discoverFromDependenciesCalled = true;

        return ['discoverFromDependencies'];
      };

      discovery.discoverInRepoAddons = function() {
        discoverInRepoAddonsCalled = true;

        return ['discoverInRepoAddons'];
      };
    });

    it('delegates to internal methods', function() {
      discovery.discoverProjectAddons(project);

      expect(discoverFromProjectItselfCalled).to.equal(true);
      expect(discoverFromInternalProjectAddonsCalled).to.equal(true);
      expect(discoverInRepoAddonsCalled).to.equal(true);
      expect(discoverFromDependenciesCalled).to.equal(true);
    });

    it('concats  discoverInRepoAddons and discoverFromDependencies results', function() {
      let result = discovery.discoverProjectAddons(project);

      expect(result).to.deep.equal([
        'discoverFromProjectItself',
        'discoverInRepoAddons', // ember-cli's own in-repo addons
        'discoverFromInternalProjectAddons',
        'discoverFromDependencies',
        'discoverInRepoAddons', // apps in-repo addons
      ]);
    });
  });

  describe('discoverAtPath', function() {
    it('returns an info object when addon is found', function() {
      let addonPath = path.join(fixturePath, 'simple/node_modules/ember-random-addon');
      const addonPkg = require(path.join(addonPath, 'package.json'));
      let discovery = new AddonDiscovery(ui);

      let result = discovery.discoverAtPath(addonPath);

      expect(result.name).to.equal('ember-random-addon');
      expect(result.path).to.equal(addonPath);
      expect(result.pkg).to.deep.equal(addonPkg);
    });

    it('discovered path resolves symlinks', function() {
      let addonPath = path.join(fixturePath, 'simple/node_modules/symlinked-addon');
      let targetPath = path.join(fixturePath, 'simple/node_modules/ember-random-addon');

      try {
        // remove any prior symlink that's floating around here
        fs.unlinkSync(addonPath);
      } catch (err) {
        // allowed to fail because symlink may not have existed
      }

      // Make our symlink. We do it here instead of committing the
      // symlink to our repo because checking out repos with symlinks
      // does the wrong thing in Windows non-administrator shells.
      fs.symlinkSync(targetPath, addonPath);

      const addonPkg = require(path.join(addonPath, 'package.json'));
      let discovery = new AddonDiscovery(ui);

      let result = discovery.discoverAtPath(addonPath);

      expect(result.name).to.equal('ember-random-addon');
      expect(result.path).to.equal(addonPath.replace('symlinked-addon', 'ember-random-addon'));
      expect(result.pkg).to.deep.equal(addonPkg);
    });

    it('returns `null` if path is not for an addon', function() {
      let addonPath = path.join(fixturePath, 'simple');
      let discovery = new AddonDiscovery(ui);

      let result = discovery.discoverAtPath(addonPath);

      expect(result).to.be.null;
    });
  });
});
