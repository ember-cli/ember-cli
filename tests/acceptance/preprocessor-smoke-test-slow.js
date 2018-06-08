'use strict';

const co = require('co');
const path = require('path');
const fs = require('fs-extra');

const experiments = require('../../lib/experiments');
const runCommand = require('../helpers/run-command');
const acceptance = require('../helpers/acceptance');
const copyFixtureFiles = require('../helpers/copy-fixture-files');
let createTestTargets = acceptance.createTestTargets;
let teardownTestTargets = acceptance.teardownTestTargets;
let linkDependencies = acceptance.linkDependencies;
let cleanupRun = acceptance.cleanupRun;

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;
let dir = chai.dir;

let appName = 'some-cool-app';
let appRoot;

if (!experiments.MODULE_UNIFICATION) {
  describe('Acceptance: preprocessor-smoke-test', function() {
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

    it('addons with standard preprocessors compile correctly', co.wrap(function *() {
      yield copyFixtureFiles('preprocessor-tests/app-with-addon-with-preprocessors');

      let packageJsonPath = path.join(appRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.devDependencies['ember-cli-sass'] = 'latest';
      packageJson.devDependencies['ember-cool-addon'] = 'latest';
      fs.writeJsonSync(packageJsonPath, packageJson);

      yield runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      expect(file('dist/assets/some-cool-app.css')).to.contain('app styles included');
      expect(file('dist/assets/vendor.css')).to.contain('addon styles included');
    }));

    it('addon registry entries are added in the proper order', co.wrap(function *() {
      yield copyFixtureFiles('preprocessor-tests/app-registry-ordering');

      let packageJsonPath = path.join(appRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.devDependencies['first-dummy-preprocessor'] = 'latest';
      packageJson.devDependencies['second-dummy-preprocessor'] = 'latest';
      fs.writeJsonSync(packageJsonPath, packageJson);

      yield runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      expect(file('dist/assets/some-cool-app.js'))
        .to.contain('replacedByPreprocessor', 'token should have been replaced in app bundle')
        .to.not.contain('__SECOND_PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not be contained')
        .to.not.contain('__FIRST_PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not be contained');
    }));

    it('addons without preprocessors compile correctly', co.wrap(function *() {
      yield copyFixtureFiles('preprocessor-tests/app-with-addon-without-preprocessors');

      let packageJsonPath = path.join(appRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.devDependencies['ember-cli-sass'] = 'latest';
      packageJson.devDependencies['ember-cool-addon'] = 'latest';
      fs.writeJsonSync(packageJsonPath, packageJson);

      yield runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      expect(file('dist/assets/some-cool-app.css')).to.contain('app styles included');
      expect(file('dist/assets/vendor.css')).to.contain('addon styles included');
    }));

    /*
      [ app ]  -> [ addon ] -> [ preprocessor addon ]
        |             |
        |             |--- preprocessor applies to this
        |
        |-- preprocessor should not apply to this
    */
    it('addons depending on preprocessor addon preprocesses addon but not app', co.wrap(function *() {
      yield copyFixtureFiles('preprocessor-tests/app-with-addon-with-preprocessors-2');

      let packageJsonPath = path.join(appRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.devDependencies['ember-cool-addon'] = 'latest';
      fs.writeJsonSync(packageJsonPath, packageJson);

      yield runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      expect(file('dist/assets/some-cool-app.js'))
        .to.contain('__PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not have been replaced in app bundle')
        .to.not.contain('replacedByPreprocessor', 'token should not have been replaced in app bundle');

      expect(file('dist/assets/vendor.js'))
        .to.contain('replacedByPreprocessor', 'token should have been replaced in vendor bundle')
        .to.not.contain('__PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should have been replaced in vendor bundle');
    }));

    /*
      [ app ]  -> [ addon ] ->  [ addon ] -> [ preprocessor addon ]
        |             |             |
        |             |             |--- preprocessor applies to this
        |             |
        |             |-- preprocessor should not apply to this
        |
        |-- preprocessor should not apply to this
    */
    it('addon N levels deep depending on preprocessor preprocesses that parent addon only', co.wrap(function *() {
      yield copyFixtureFiles('preprocessor-tests/app-with-addon-with-preprocessors-3');

      let packageJsonPath = path.join(appRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.devDependencies['ember-shallow-addon'] = 'latest';

      fs.writeJsonSync(packageJsonPath, packageJson);

      yield runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      expect(file('dist/assets/some-cool-app.js'))
        .to.contain('__PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not have been replaced in app bundle')
        .to.not.contain('replacedByPreprocessor', 'token should not have been replaced in app bundle');

      expect(file('dist/assets/vendor.js'))
        .to.contain('deep: "replacedByPreprocessor"', 'token should have been replaced in deep component')
        .to.contain('shallow: __PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not have been replaced in shallow component')
        .to.not.contain('deep: __PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should have been replaced in deep component')
        .to.not.contain('shallow: "replacedByPreprocessor"', 'token should not have been replaced in shallow component');
    }));
  });
}
