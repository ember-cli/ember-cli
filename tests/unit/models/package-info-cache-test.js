'use strict';

const path = require('path');
const expect = require('chai').expect;
const PackageInfoCache = require('../../../lib/models/package-info-cache');
const Project = require('../../../lib/models/project');
let addonFixturePath = path.resolve(__dirname, '../../fixtures/addon');
const MockUI = require('console-ui/mock');
const MockCLI = require('../../helpers/mock-cli');

describe('models/package-info-cache.js', function() {
  let project, projectPath, packageJsonPath, packageContents, projectPackageInfo, ui, cli, pic;
  this.timeout(20000);

  beforeEach(function() {
    ui = new MockUI();
    cli = new MockCLI({ ui });
  });

  describe('packageInfo contents tests on valid project', function() {
    beforeEach(function() {
      projectPath = path.resolve(addonFixturePath, 'simple');
      packageJsonPath = path.join(projectPath, 'package.json');
      packageContents = require(packageJsonPath);
      project = new Project(projectPath, packageContents, ui, cli);
      pic = project.packageInfoCache;

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

    it('shows projectPackageInfo error is "3 dependencies missing"', function() {
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

    it('shows projectPackageInfo has 8 devDependencyPackages', function() {
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

    it('shows projectPackageInfo has 9 node-module entries', function() {
      let nodeModules = projectPackageInfo.nodeModules;
      expect(nodeModules).to.exist;
      expect(nodeModules.entries).to.exist;
      expect(Object.keys(nodeModules.entries).length).to.equal(9);
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

  describe('discoverProjectAddons tests on external-dependency project', function() {
    beforeEach(function() {
      projectPath = path.resolve(addonFixturePath, 'external-dependency');
      packageJsonPath = path.join(projectPath, 'package.json');
      packageContents = require(packageJsonPath);
      project = new Project(projectPath, packageContents, ui, cli);
      project.discoverAddons();

      pic = project.packageInfoCache;
      projectPackageInfo = pic.getEntry(projectPath);
    });

    it('shows dependency packages exist and are in project.addonPackages', function() {
      expect(project.addonPackages).to.exist;
      let packageNames = Object.keys(project.addonPackages);
      expect(packageNames.length).to.equal(9);
      expect(packageNames.indexOf('ember-cli-blueprint-test-helpers')).to.be.above(-1);
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
