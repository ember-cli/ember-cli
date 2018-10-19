'use strict';

const path = require('path');
const expect = require('chai').expect;
const PackageInfoCache = require('../../../../lib/models/package-info-cache');
const PackageInfo = require('../../../../lib/models/package-info-cache/package-info');
const Project = require('../../../../lib/models/project');
const addonFixturePath = path.resolve(__dirname, '../../../fixtures/addon');
const MockUI = require('console-ui/mock');
const MockCLI = require('../../../helpers/mock-cli');
const FixturifyProject = require('../../../helpers/fixturify-project');

describe('models/package-info-cache/package-info-cache-test.js', function() {
  let project, projectPath, packageJsonPath, packageContents, projectPackageInfo, resolvedFile, ui, cli, pic;
  this.timeout(20000);

  beforeEach(function() {
    ui = new MockUI();
    cli = new MockCLI({ ui });
  });

  describe('lexicographically', function() {
    it('works', function() {
      expect([
        { name: 'c'     },
        { foo: 2        },
        { name: 'z/b/z' },
        { name: 'z/b/d' },
        { foo: 1        },
        { name: 'z/a/d' },
        { name: 'z/a/c' },
        { name: 'b'     },
        { name: 'z/a/d' },
        { name: 'a'     },
        { foo: 3        },
      ].sort(PackageInfo.lexicographically)).to.eql([
        { name: 'a'      },
        { name: 'b'      },
        { name: 'c'      },
        { name: 'z/a/c'  },
        { name: 'z/a/d'  },
        { name: 'z/a/d'  },
        { name: 'z/b/d'  },
        { name: 'z/b/z'  },
        { foo: 2         },
        { foo: 1         },
        { foo: 3         },
      ]);
    });
  });

  describe('pushUnique', function() {
    it('works (and does last write win)', function() {
      let a = { name: 'a' };
      let b = { name: 'b' };
      let c = { name: 'c' };

      let result = [];
      [
        a,
        a,
        a,
        b,
        a,
        c,
        a,
        c,
      ].forEach(entry => PackageInfo.pushUnique(result, entry));

      expect(result).to.eql([
        b,
        a,
        c,
      ]);
    });
  });

  describe('packageInfo contents tests on valid project', function() {
    let projectPath, packageJsonPath, packageContents, projectPackageInfo;

    beforeEach(function() {
      projectPath = path.resolve(addonFixturePath, 'simple');
      packageJsonPath = path.join(projectPath, 'package.json');
      packageContents = require(packageJsonPath);
      let project = new Project(projectPath, packageContents, ui, cli);
      let pic = project.packageInfoCache;

      projectPackageInfo = pic.getEntry(projectPath);
    });

    it('finds project PackageInfo entry for project root', function() {
      expect(projectPackageInfo).to.exist;
    });

    it('projectPackageInfo has a "pkg" field', function() {
      expect(projectPackageInfo.pkg).to.exist;
    });

    it('shows projectPackageInfo is considered valid', function() {
      expect(projectPackageInfo.valid).to.be.true;
    });

    it('is a project, so it may have addons', function() {
      expect(projectPackageInfo.mayHaveAddons).to.eql(true);
    });

    it('shows projectPackageInfo has cliInfo at ember-cli root dir', function() {
      expect(projectPackageInfo.cliInfo).to.exist;

      let cliRealPath = projectPackageInfo.cliInfo.realPath;
      let emberCliRealPath = path.resolve(`${projectPackageInfo.realPath}/../../../../`);
      expect(cliRealPath).to.equal(emberCliRealPath);
    });

    it('shows projectPackageInfo has 1 error', function() {
      expect(projectPackageInfo.hasErrors()).to.be.true;

      let errorArray = projectPackageInfo.errors.getErrors();

      expect(errorArray.length).to.equal(1);
    });

    // TODO: the input to this test is poluted by other tests: https://github.com/ember-cli/ember-cli/issues/7981
    it.skip('shows projectPackageInfo error is "3 dependencies missing"', function() {
      let errorArray = projectPackageInfo.errors.getErrors();
      let error = errorArray[0];
      expect(error.type).to.equal('dependenciesMissing');
      expect(error.data.length).to.equal(3);
    });

    it('shows projectPackageInfo has 1 dependencyPackage', function() {
      let dependencyPackages = projectPackageInfo.dependencyPackages;

      expect(dependencyPackages).to.exist;
      expect(Object.keys(dependencyPackages).length).to.equal(1);
      expect(dependencyPackages['something-else']).to.exist;
    });

    // TODO: the input to this test is poluted by other tests: https://github.com/ember-cli/ember-cli/issues/7981
    it.skip('shows projectPackageInfo has 8 devDependencyPackages', function() {
      let devDependencyPackages = projectPackageInfo.devDependencyPackages;
      expect(devDependencyPackages).to.exist;
      expect(Object.keys(devDependencyPackages).length).to.equal(8);
    });

    it('shows projectPackageInfo.devDependencyPackages + missing dependencies = project.devDependencies', function() {
      let devDependencyPackages = projectPackageInfo.devDependencyPackages;
      expect(devDependencyPackages).to.exist;
      let devDependencyPackageNames = Object.keys(devDependencyPackages);

      let devDependencies = projectPackageInfo.pkg.devDependencies;
      expect(devDependencies).to.exist;
      let devDependencyNames = Object.keys(devDependencies).sort();

      let errorArray = projectPackageInfo.errors.getErrors();
      let error = errorArray[0];
      expect(error.type).to.equal('dependenciesMissing');

      let missingDependencies = error.data;

      let packageAndErrorNames = devDependencyPackageNames.concat(missingDependencies).sort();

      expect(packageAndErrorNames).to.deep.equal(devDependencyNames);
    });

    it('shows projectPackageInfo has 1 in-repo addon named "ember-super-button"', function() {
      let inRepoAddons = projectPackageInfo.inRepoAddons;
      expect(inRepoAddons).to.exist;
      expect(inRepoAddons.length).to.equal(1);
      expect(inRepoAddons[0].realPath.indexOf(`simple${path.sep}lib${path.sep}ember-super-button`)).to.be.above(0);
      expect(inRepoAddons[0].pkg.name).to.equal('ember-super-button');
    });

    it('shows projectPackageInfo has 7 internal addon packages', function() {
      let internalAddons = projectPackageInfo.internalAddons;
      expect(internalAddons).to.exist;
      expect(internalAddons.length).to.equal(7);
    });

    // TODO: the input to this test is poluted by other tests: https://github.com/ember-cli/ember-cli/issues/7981
    it.skip('shows projectPackageInfo has 9 node-module entries', function() {
      let nodeModules = projectPackageInfo.nodeModules;
      expect(nodeModules).to.exist;
      expect(nodeModules.entries).to.exist;
      expect(Object.keys(nodeModules.entries).length).to.equal(9);
    });

  });

  describe('packageInfo', function() {
    describe('valid project', function() {
      let project, fixturifyProject;
      before(function() {
        // create a new ember-app
        fixturifyProject = new FixturifyProject('simple-ember-app', '0.0.0', project => {
          project.addAddon('ember-resolver', '^5.0.1');
          project.addAddon('ember-random-addon', 'latest');
          project.addAddon('loader.js', 'latest');
          project.addAddon('something-else', 'latest');

          project.addInRepoAddon('ember-super-button', 'latest');
          project.addDevDependency('ember-cli', 'latest');
          project.addDevDependency('non-ember-thingy', 'latest');
        });

        fixturifyProject.writeSync();

        project = fixturifyProject.buildProjectModel(Project);
        project.discoverAddons();
        pic = project.packageInfoCache;
        projectPackageInfo = pic.getEntry(path.join(fixturifyProject.root, 'simple-ember-app'));
      });

      after(function() {
        fixturifyProject.dispose();
      });

      it('has dependencies who have their mayHaveAddons correctly set', function() {
        expect(projectPackageInfo.devDependencyPackages['non-ember-thingy']).to.have.property('mayHaveAddons', false);
        expect(projectPackageInfo.devDependencyPackages['ember-cli']).to.have.property('mayHaveAddons', false);
        expect(projectPackageInfo.dependencyPackages['loader.js']).to.have.property('mayHaveAddons', true);
        expect(projectPackageInfo.dependencyPackages['ember-resolver']).to.have.property('mayHaveAddons', true);
        expect(projectPackageInfo.dependencyPackages['ember-random-addon']).to.have.property('mayHaveAddons', true);
        expect(projectPackageInfo.dependencyPackages['something-else']).to.have.property('mayHaveAddons', true);
      });

      it('validates projectPackageInfo', function() {
        expect(projectPackageInfo).to.exist;
        expect(projectPackageInfo.pkg).to.exist;
        expect(projectPackageInfo.valid).to.be.true;
      });

      it('shows projectPackageInfo has 0 errors', function() {
        expect(projectPackageInfo.hasErrors()).to.be.false;
        expect(projectPackageInfo.errors.getErrors()).to.have.property('length', 0);
      });

      it('shows projectPackageInfo has 1 dependencyPackage', function() {
        let dependencyPackages = projectPackageInfo.dependencyPackages;

        expect(dependencyPackages).to.exist;
        expect(Object.keys(dependencyPackages).length).to.equal(4);
        expect(dependencyPackages['something-else']).to.exist;
      });

      it('shows projectPackageInfo has 82devDependencyPackages', function() {
        let devDependencyPackages = projectPackageInfo.devDependencyPackages;

        expect(devDependencyPackages).to.exist;
        expect(Object.keys(devDependencyPackages).length).to.equal(2);
      });

      it('shows projectPackageInfo has 1 in-repo addon named "ember-super-button"', function() {
        let inRepoAddons = projectPackageInfo.inRepoAddons;

        expect(inRepoAddons).to.exist;
        expect(inRepoAddons.length).to.equal(1);
        expect(inRepoAddons[0].realPath).to.contain(path.join('simple-ember-app', 'lib', 'ember-super-button'));
        expect(inRepoAddons[0].pkg.name).to.equal('ember-super-button');
      });

      it('shows projectPackageInfo has 7 internal addon packages', function() {
        let internalAddons = projectPackageInfo.internalAddons;

        expect(internalAddons).to.exist;
        expect(internalAddons.length).to.equal(7);
      });

      it('shows projectPackageInfo has 7 node-module entries', function() {
        let nodeModules = projectPackageInfo.nodeModules;

        expect(nodeModules).to.exist;
        expect(nodeModules.entries).to.exist;
        expect(Object.keys(nodeModules.entries).length).to.equal(6);
      });
    });
  });

  describe('packageInfo contents tests on missing project', function() {
    beforeEach(function() {
      projectPath = path.resolve(addonFixturePath, 'fakepackage');

      let deps = {
        'foo-bar': 'latest',
        'blah-blah': '1.0.0',
      };

      let devDeps = {
        'dev-foo-bar': 'latest',
      };

      packageContents = {
        dependencies: deps,
        devDependencies: devDeps,
      };

      project = new Project(projectPath, packageContents, ui, cli);

      pic = project.packageInfoCache;
      projectPackageInfo = pic.getEntry(projectPath);
    });

    it('creates a packageInfo object for the missing path', function() {
      expect(projectPackageInfo).to.exist;
    });

    it('has 3 errors', function() {
      let errors = projectPackageInfo.errors;
      expect(errors).to.exist;
      expect(errors.hasErrors()).to.be.true;
      expect(errors.getErrors().length).to.equal(3);
    });

    it('has a "packageDirectoryMissing" error', function() {
      let errorArray = projectPackageInfo.errors.getErrors();
      let pkgDirMissingErr = errorArray.find(function(err) {
        return err.type === 'packageDirectoryMissing';
      });
      expect(pkgDirMissingErr).to.exist;
      expect(pkgDirMissingErr.data).to.equal(projectPath);
    });

    it('has empty "dependencyPackages" and "devDependencyPackages" objects', function() {
      expect(projectPackageInfo.dependencyPackages).to.exist;
      expect(projectPackageInfo.devDependencyPackages).to.exist;
      expect(Object.keys(projectPackageInfo.dependencyPackages).length).to.equal(0);
      expect(Object.keys(projectPackageInfo.devDependencyPackages).length).to.equal(0);
    });
  });

  describe('packageInfo contents tests on with-nested-addons project', function() {
    beforeEach(function() {
      projectPath = path.resolve(addonFixturePath, 'with-nested-addons');
      packageJsonPath = path.join(projectPath, 'package.json');
      packageContents = null; // there is no actual package.json
      project = new Project(projectPath, packageContents, ui, cli);

      pic = project.packageInfoCache;
      projectPackageInfo = pic.getEntry(projectPath);
    });

    it('shows projectPackageInfo has a "packageJsonMissing" error', function() {
      let errorArray = projectPackageInfo.errors.getErrors();
      let pkgJsonMissingErr = errorArray.find(function(err) {
        return err.type === 'packageJsonMissing';
      });
      expect(pkgJsonMissingErr).to.exist;
      expect(pkgJsonMissingErr.data).to.equal(packageJsonPath);
    });
  });

  describe('packageInfo contents tests on external-dependency project', function() {
    beforeEach(function() {
      projectPath = path.resolve(addonFixturePath, 'external-dependency');
      packageJsonPath = path.join(projectPath, 'package.json');
      packageContents = require(packageJsonPath);
      project = new Project(projectPath, packageContents, ui, cli);

      pic = project.packageInfoCache;
      projectPackageInfo = pic.getEntry(projectPath);
    });

    it('shows projectPackageInfo finds a dependency above project root', function() {
      expect(projectPackageInfo.dependencyPackages).to.exist;

      let emberCliStringUtilsPkgInfo = projectPackageInfo.dependencyPackages['ember-cli-string-utils'];
      expect(emberCliStringUtilsPkgInfo).to.exist;

      let emberCliRealPath = path.resolve(`${projectPackageInfo.realPath}/../../../../`);
      expect(emberCliStringUtilsPkgInfo.realPath).to.equal(path.join(emberCliRealPath, 'node_modules', 'ember-cli-string-utils'));
    });

    it('shows projectPackageInfo finds an external dependency involving a scope', function() {
      expect(projectPackageInfo.dependencyPackages).to.exist;

      let restPkgInfo = projectPackageInfo.dependencyPackages['@octokit/rest'];
      expect(restPkgInfo).to.exist;

      let emberCliRealPath = path.resolve(`${projectPackageInfo.realPath}/../../../../`);
      expect(restPkgInfo.realPath).to.equal(path.join(emberCliRealPath, 'node_modules', '@octokit', 'rest'));
    });
  });

  describe('discoverProjectAddons', function() {
    let fixturifyProject;

    afterEach(function() {
      if (fixturifyProject) {
        fixturifyProject.dispose();
      }
    });

    describe('within an addon', function() {
      beforeEach(function() {
        fixturifyProject = new FixturifyProject('external-dependency', '0.0.0', project => {
          project.addDevDependency('ember-cli-string-utils', 'latest');
          project.addDevDependency('@octokit/rest', 'latest');
          project.addAddon('ember-cli-blueprint-test-helpers', 'latest');
          project.addAddon('c', 'latest');
          project.addAddon('a', 'latest');
          project.addAddon('b', 'latest');

          project.addDevAddon('y', 'latest');
          project.addDevAddon('z', 'latest');
          project.addDevAddon('x', 'latest');

          project.addInRepoAddon('t', 'latest');
          project.addInRepoAddon('s', 'latest');

          project.pkg.keywords.push('ember-addon');
          project.pkg.keywords.push('ember-addon');
        });
      });

      it('lock down dependency orderings', function() {
        let project = fixturifyProject.buildProjectModel();

        project.discoverAddons();

        expect(Object.keys(project.addonPackages)).to.deep.equal([
          // itself
          'external-dependency',

          // dev dependencies
          'x',
          'y',
          'z',

          // dependencies
          'a',
          'b',
          'c',
          'ember-cli-blueprint-test-helpers',

          // in repo addons
          's',
          't',
        ]);
      });
    });
  });

  describe('tests for projectPackageInfo.addonMainPath', function() {
    let origPackageContents;

    beforeEach(function() {
      projectPath = path.resolve(addonFixturePath, 'external-dependency');
      packageJsonPath = path.join(projectPath, 'package.json');
      // Because we allow the tests to modify packageContents, and the original
      // 'require' of package contents will always return the same structure
      // once it has been required, we must deep-copy that structure before letting
      // the tests modify it, so they modify only the copy.
      if (!origPackageContents) {
        origPackageContents = require(packageJsonPath);
        origPackageContents['ember-addon'] = Object.create(null);
      }

      packageContents = JSON.parse(JSON.stringify(origPackageContents));
    });

    it('adds .js if not present', function() {
      packageContents['ember-addon']['main'] = 'index';

      project = new Project(projectPath, packageContents, ui, cli);
      projectPackageInfo = project.packageInfoCache.getEntry(projectPath);

      resolvedFile = path.basename(projectPackageInfo.addonMainPath);
      expect(resolvedFile).to.equal('index.js');
    });

    it('doesn\'t add .js if it is .js', function() {
      packageContents['ember-addon']['main'] = 'index.js';

      project = new Project(projectPath, packageContents, ui, cli);
      projectPackageInfo = project.packageInfoCache.getEntry(projectPath);

      resolvedFile = path.basename(projectPackageInfo.addonMainPath);
      expect(resolvedFile).to.equal('index.js');
    });

    it('doesn\'t add .js if it has another extension', function() {
      packageContents['ember-addon']['main'] = 'index.coffee';

      project = new Project(projectPath, packageContents, ui, cli);
      projectPackageInfo = project.packageInfoCache.getEntry(projectPath);

      resolvedFile = path.basename(projectPackageInfo.addonMainPath);
      expect(resolvedFile).to.equal('index.coffee');
    });

    it('allows lookup of existing non-`index.js` `main` entry points', function() {
      delete packageContents['ember-addon'];
      packageContents['main'] = 'some/other/path.js';

      project = new Project(projectPath, packageContents, ui, cli);
      projectPackageInfo = project.packageInfoCache.getEntry(projectPath);

      resolvedFile = projectPackageInfo.addonMainPath;
      expect(resolvedFile).to.equal(path.join(projectPath, 'some/other/path.js'));
    });

    it('fails invalid other `main` entry points', function() {
      delete packageContents['ember-addon'];
      packageContents['main'] = 'some/other/non-existent-file.js';

      project = new Project(projectPath, packageContents, ui, cli);
      projectPackageInfo = project.packageInfoCache.getEntry(projectPath);

      expect(projectPackageInfo.hasErrors()).to.be.true;
      expect(projectPackageInfo.errors.getErrors().length).to.equal(1);
      let error = projectPackageInfo.errors.getErrors()[0];
      expect(error.type).to.equal('emberAddonMainMissing');
    });

    it('falls back to `index.js` if `main` and `ember-addon` are not found', function() {
      delete packageContents['ember-addon'];

      project = new Project(projectPath, packageContents, ui, cli);
      projectPackageInfo = project.packageInfoCache.getEntry(projectPath);

      resolvedFile = projectPackageInfo.addonMainPath;
      expect(resolvedFile).to.equal(path.join(projectPath, 'index.js'));
    });

    it('falls back to `index.js` if `main` and `ember-addon.main` are not found', function() {
      delete packageContents['ember-addon'].main;

      project = new Project(projectPath, packageContents, ui, cli);
      projectPackageInfo = project.packageInfoCache.getEntry(projectPath);

      resolvedFile = projectPackageInfo.addonMainPath;
      expect(resolvedFile).to.equal(path.join(projectPath, 'index.js'));
    });
  });

  describe('getRealFilePath tests', function() {
    let fakePackageJsonPath;

    beforeEach(function() {
      projectPath = path.resolve(addonFixturePath, 'external-dependency');
      packageJsonPath = path.join(projectPath, 'package.json');
      fakePackageJsonPath = path.join(projectPath, 'foozleberry.js');
    });

    it('getRealFilePath(real package.json file) exists', function() {
      expect(PackageInfoCache.getRealFilePath(packageJsonPath)).to.exist;
    });

    it('getRealFilePath(fake file path) does not exist', function() {
      expect(PackageInfoCache.getRealFilePath(fakePackageJsonPath)).not.to.exist;
    });

    it('getRealFilePath(dir path) does not exist', function() {
      expect(PackageInfoCache.getRealFilePath(projectPath)).not.to.exist;
    });
  });

  describe('getRealDirectoryPath tests', function() {
    let fakePackageJsonPath;

    beforeEach(function() {
      projectPath = path.resolve(addonFixturePath, 'external-dependency');
      packageJsonPath = path.join(projectPath, 'package.json');
      fakePackageJsonPath = path.join(projectPath, 'foozleberry.js');
    });

    it('getRealDirectoryPath(real package directory) exists', function() {
      expect(PackageInfoCache.getRealDirectoryPath(projectPath)).to.exist;
    });

    it('getRealDirectoryPath(fake path) does not exist', function() {
      expect(PackageInfoCache.getRealDirectoryPath(fakePackageJsonPath)).not.to.exist;
    });

    it('getRealDirectoryPath(real file path) does not exist', function() {
      expect(PackageInfoCache.getRealDirectoryPath(packageJsonPath)).not.to.exist;
    });
  });
});
