'use strict';

var path       = require('path');
var fs         = require('fs');
var expect     = require('chai').expect;

var runCommand          = require('../helpers/run-command');
var acceptance          = require('../helpers/acceptance');
var copyFixtureFiles    = require('../helpers/copy-fixture-files');
var assertDirEmpty      = require('../helpers/assert-dir-empty');
var createTestTargets   = acceptance.createTestTargets;
var teardownTestTargets = acceptance.teardownTestTargets;
var linkDependencies    = acceptance.linkDependencies;
var cleanupRun          = acceptance.cleanupRun;

var appName             = 'some-cool-app';
var packageJsonPath     = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
var packageJson;

function buildProject() {
  return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
}

function appendDevDependencies(deps) {
  return function() {
    Object.keys(deps).forEach(function (key) {
      packageJson.devDependencies[key] = deps[key];
    });

    return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
  };
}

function removeDevDependencies() {
  var deps = Array.prototype.slice.apply(arguments);
  return function () {
    deps.forEach(function (d) {
      delete packageJson.devDependencies[d];
    });
    return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
  };
}

function distAsset(filename) {
  return fs.readFileSync(path.join('.', 'dist', 'assets', filename), {
    encoding: 'utf8'
  });
}

describe('Acceptance: preprocessor-smoke-test', function() {
  before(function() {
    this.timeout(360000);
    return createTestTargets(appName).then(function () {
      packageJson = require(packageJsonPath);
    });
  });

  after(function() {
    this.timeout(15000);
    return teardownTestTargets();
  });

  beforeEach(function() {
    this.timeout(360000);
    return linkDependencies(appName);
  });

  afterEach(function() {
    this.timeout(15000);
    return cleanupRun().then(function() {
      assertDirEmpty('tmp');
    });
  });

  it('addons with standard preprocessors compile correctly', function() {
    this.timeout(100000);

    return copyFixtureFiles('preprocessor-tests/app-with-addon-with-preprocessors')
      .then(appendDevDependencies({
        'broccoli-sass': 'latest',
        'ember-cool-addon': 'latest'
      }))
      .then(buildProject)
      .then(function() {
        var mainCSS = distAsset('some-cool-app.css');
        var vendorCSS = distAsset('vendor.css');

        expect(mainCSS).to.contain('app styles included');
        expect(vendorCSS).to.contain('addon styles included');
      })
      .then(removeDevDependencies('broccoli-sass', 'ember-cool-addon'));
  });

  it('addon registry entries are added in the proper order', function() {
    this.timeout(100000);

    return copyFixtureFiles('preprocessor-tests/app-registry-ordering')
      .then(appendDevDependencies({
        'first-dummy-preprocessor': 'latest',
        'second-dummy-preprocessor': 'latest'
      }))
      .then(buildProject)
      .then(function() {
        var appJs = distAsset('some-cool-app.js');

        expect(appJs).to.not.contain('__SECOND_PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not be contained');
        expect(appJs).to.not.contain('__FIRST_PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not be contained');
        expect(appJs).to.contain('replacedByPreprocessor', 'token should have been replaced in app bundle');
      })
      .then(removeDevDependencies('first-dummy-preprocessor', 'second-dummy-preprocessor'));
  });

  it('addons without preprocessors compile correctly', function() {
    this.timeout(100000);

    return copyFixtureFiles('preprocessor-tests/app-with-addon-without-preprocessors')
      .then(appendDevDependencies({
        'broccoli-sass': 'latest',
        'ember-cool-addon': 'latest'
      }))
      .then(buildProject)
      .then(function() {
        var mainCSS = distAsset('some-cool-app.css');
        var vendorCSS = distAsset('vendor.css');

        expect(mainCSS).to.contain('app styles included');
        expect(vendorCSS).to.contain('addon styles included');
      })
      .then(removeDevDependencies('broccoli-sass', 'ember-cool-addon'));
  });

  /*
    [ app ]  -> [ addon ] -> [ preprocessor addon ]
      |             |
      |             |--- preprocessor applies to this
      |
      |-- preprocessor should not apply to this
  */
  it('addons depending on preprocessor addon preprocesses addon but not app', function() {
    this.timeout(100000);

    return copyFixtureFiles('preprocessor-tests/app-with-addon-with-preprocessors-2')
      .then(appendDevDependencies({
        'ember-cool-addon': 'latest'
      }))
      .then(buildProject)
      .then(function() {
        var appJs = distAsset('some-cool-app.js');
        var vendorJs = distAsset('vendor.js');

        expect(appJs).to.contain('__PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not have been replaced in app bundle');
        expect(appJs).to.not.contain('replacedByPreprocessor', 'token should not have been replaced in app bundle');
        expect(vendorJs).to.not.contain('__PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should have been replaced in vendor bundle');
        expect(vendorJs).to.contain('replacedByPreprocessor', 'token should have been replaced in vendor bundle');
      })
      .then(removeDevDependencies('ember-cool-addon'));
  });

  /*
    [ app ]  -> [ addon ] ->  [ addon ] -> [ preprocessor addon ]
      |             |             |
      |             |             |--- preprocessor applies to this
      |             |
      |             |-- preprocessor should not apply to this
      |
      |-- preprocessor should not apply to this
  */
  it('addon N levels deep depending on preprocessor preprocesses that parent addon only', function() {
    this.timeout(100000);

    return copyFixtureFiles('preprocessor-tests/app-with-addon-with-preprocessors-3')
      .then(appendDevDependencies({
        'ember-shallow-addon': 'latest'
      }))
      .then(buildProject)
      .then(function() {
        var appJs = distAsset('some-cool-app.js');
        var vendorJs = distAsset('vendor.js');

        expect(appJs).to.contain('__PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not have been replaced in app bundle');
        expect(appJs).to.not.contain('replacedByPreprocessor', 'token should not have been replaced in app bundle');
        expect(vendorJs).to.not.contain('deep: __PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should have been replaced in deep component');
        expect(vendorJs).to.contain('deep: "replacedByPreprocessor"', 'token should have been replaced in deep component');
        expect(vendorJs).to.contain('shallow: __PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not have been replaced in shallow component');
        expect(vendorJs).to.not.contain('shallow: "replacedByPreprocessor"', 'token should not have been replaced in shallow component');
      })
      .then(removeDevDependencies('ember-shallow-addon'));
  });
});
