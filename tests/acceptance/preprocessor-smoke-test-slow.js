'use strict';

var path       = require('path');
var fs         = require('fs-extra');

var runCommand          = require('../helpers/run-command');
var acceptance          = require('../helpers/acceptance');
var copyFixtureFiles    = require('../helpers/copy-fixture-files');
var createTestTargets   = acceptance.createTestTargets;
var teardownTestTargets = acceptance.teardownTestTargets;
var linkDependencies    = acceptance.linkDependencies;
var cleanupRun          = acceptance.cleanupRun;

var chai = require('../chai');
var expect = chai.expect;
var file = chai.file;
var dir = chai.dir;

var appName  = 'some-cool-app';

describe('Acceptance: preprocessor-smoke-test', function() {
  this.timeout(360000);

  before(function() {
    return createTestTargets(appName);
  });

  after(function() {
    return teardownTestTargets();
  });

  beforeEach(function() {
    return linkDependencies(appName);
  });

  afterEach(function() {
    return cleanupRun(appName).then(function() {
      expect(dir('tmp/' + appName)).to.not.exist;
    });
  });

  it('addons with standard preprocessors compile correctly', function() {
    return copyFixtureFiles('preprocessor-tests/app-with-addon-with-preprocessors')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = fs.readJsonSync(packageJsonPath);
        packageJson.devDependencies['ember-cli-sass'] = 'latest';
        packageJson.devDependencies['ember-cool-addon'] = 'latest';

        return fs.writeJsonSync(packageJsonPath, packageJson);
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        expect(file('dist/assets/some-cool-app.css')).to.contain('app styles included');
        expect(file('dist/assets/vendor.css')).to.contain('addon styles included');
      });
  });

  it('addon registry entries are added in the proper order', function() {
    return copyFixtureFiles('preprocessor-tests/app-registry-ordering')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = fs.readJsonSync(packageJsonPath);
        packageJson.devDependencies['first-dummy-preprocessor'] = 'latest';
        packageJson.devDependencies['second-dummy-preprocessor'] = 'latest';

        return fs.writeJsonSync(packageJsonPath, packageJson);
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        expect(file('dist/assets/some-cool-app.js'))
          .to.contain('replacedByPreprocessor', 'token should have been replaced in app bundle')
          .to.not.contain('__SECOND_PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not be contained')
          .to.not.contain('__FIRST_PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not be contained');
      });
  });

  it('addons without preprocessors compile correctly', function() {
    return copyFixtureFiles('preprocessor-tests/app-with-addon-without-preprocessors')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = fs.readJsonSync(packageJsonPath);
        packageJson.devDependencies['ember-cli-sass'] = 'latest';
        packageJson.devDependencies['ember-cool-addon'] = 'latest';

        return fs.writeJsonSync(packageJsonPath, packageJson);
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        expect(file('dist/assets/some-cool-app.css')).to.contain('app styles included');
        expect(file('dist/assets/vendor.css')).to.contain('addon styles included');
      });
  });

  /*
    [ app ]  -> [ addon ] -> [ preprocessor addon ]
      |             |
      |             |--- preprocessor applies to this
      |
      |-- preprocessor should not apply to this
  */
  it('addons depending on preprocessor addon preprocesses addon but not app', function() {
    return copyFixtureFiles('preprocessor-tests/app-with-addon-with-preprocessors-2')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = fs.readJsonSync(packageJsonPath);
        packageJson.devDependencies['ember-cool-addon'] = 'latest';

        return fs.writeJsonSync(packageJsonPath, packageJson);
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        expect(file('dist/assets/some-cool-app.js'))
          .to.contain('__PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not have been replaced in app bundle')
          .to.not.contain('replacedByPreprocessor', 'token should not have been replaced in app bundle');

        expect(file('dist/assets/vendor.js'))
          .to.contain('replacedByPreprocessor', 'token should have been replaced in vendor bundle')
          .to.not.contain('__PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should have been replaced in vendor bundle');
      });
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
    return copyFixtureFiles('preprocessor-tests/app-with-addon-with-preprocessors-3')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = fs.readJsonSync(packageJsonPath);
        packageJson.devDependencies['ember-shallow-addon'] = 'latest';

        return fs.writeJsonSync(packageJsonPath, packageJson);
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        expect(file('dist/assets/some-cool-app.js'))
          .to.contain('__PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not have been replaced in app bundle')
          .to.not.contain('replacedByPreprocessor', 'token should not have been replaced in app bundle');

        expect(file('dist/assets/vendor.js'))
          .to.contain('deep: "replacedByPreprocessor"', 'token should have been replaced in deep component')
          .to.contain('shallow: __PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not have been replaced in shallow component')
          .to.not.contain('deep: __PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should have been replaced in deep component')
          .to.not.contain('shallow: "replacedByPreprocessor"', 'token should not have been replaced in shallow component');
      });
  });

});
