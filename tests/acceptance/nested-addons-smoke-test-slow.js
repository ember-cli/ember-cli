'use strict';

var path = require('path');
var fs = require('fs-extra');

var runCommand = require('../helpers/run-command');
var acceptance = require('../helpers/acceptance');
var copyFixtureFiles = require('../helpers/copy-fixture-files');
var createTestTargets = acceptance.createTestTargets;
var teardownTestTargets = acceptance.teardownTestTargets;
var linkDependencies = acceptance.linkDependencies;
var cleanupRun = acceptance.cleanupRun;

var chai = require('../chai');
var expect = chai.expect;
var file = chai.file;
var dir = chai.dir;

var appName = 'some-cool-app';
var appRoot;

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
        var packageJsonPath = path.join(appRoot, 'package.json');
        var packageJson = fs.readJsonSync(packageJsonPath);
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
