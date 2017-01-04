'use strict';

let path = require('path');
let fs = require('fs-extra');

let runCommand = require('../helpers/run-command');
let acceptance = require('../helpers/acceptance');
let copyFixtureFiles = require('../helpers/copy-fixture-files');
let createTestTargets = acceptance.createTestTargets;
let teardownTestTargets = acceptance.teardownTestTargets;
let linkDependencies = acceptance.linkDependencies;
let cleanupRun = acceptance.cleanupRun;

let chai = require('../chai');
let expect = chai.expect;
let file = chai.file;
let dir = chai.dir;

let appName = 'some-cool-app';
let appRoot;

describe('Acceptance: nested-addons-smoke-test', function() {
  this.timeout(360000);

  before(function() {
    return createTestTargets(appName);
  });

  after(teardownTestTargets);

  beforeEach(function() {
    appRoot = linkDependencies(appName);
  });

  afterEach(function() {
    cleanupRun(appName);
    expect(dir(appRoot)).to.not.exist;
  });

  it('addons with nested addons compile correctly', function() {
    return copyFixtureFiles('addon/with-nested-addons')
      .then(function() {
        let packageJsonPath = path.join(appRoot, 'package.json');
        let packageJson = fs.readJsonSync(packageJsonPath);
        packageJson.devDependencies['ember-top-addon'] = 'latest';

        return fs.writeJsonSync(packageJsonPath, packageJson);
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        expect(file('dist/assets/vendor.js')).to.contain('INNER_ADDON_IMPORT_WITH_APP_IMPORT');
        expect(file('dist/assets/vendor.js')).to.contain('INNER_ADDON_IMPORT_WITH_THIS_IMPORT');
      });
  });
});
