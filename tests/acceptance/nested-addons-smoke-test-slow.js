'use strict';

const path = require('path');
const fs = require('fs-extra');

const { isExperimentEnabled } = require('../../lib/experiments');
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

  if (!isExperimentEnabled('MODULE_UNIFICATION')) {
    it('addons with nested addons compile correctly', async function() {
      await copyFixtureFiles('addon/with-nested-addons');

      let packageJsonPath = path.join(appRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.devDependencies['ember-top-addon'] = 'latest';
      fs.writeJsonSync(packageJsonPath, packageJson);

      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      expect(file('dist/assets/vendor.js')).to.contain('INNER_ADDON_IMPORT_WITH_APP_IMPORT');
      expect(file('dist/assets/vendor.js')).to.contain('INNER_ADDON_IMPORT_WITH_THIS_IMPORT');

      // RAW comments should have been converted to PREPROCESSED by
      // tests/fixtures/addon/with-nested-addons/node_modules/ember-top-addon/node_modules/preprocesstree-addon
      // then from PREPROCESSED to POSTPROCESSED by
      // tests/fixtures/addon/with-nested-addons/node_modules/ember-top-addon/node_modules/postprocesstree-addon
      expect(file('dist/assets/vendor.js')).to.contain(
        'POSTPROCESSED node_modules/ember-top-addon/addon/templates/application.hbs'
      );
      expect(file('dist/assets/vendor.js')).to.contain('POSTPROCESSED node_modules/ember-top-addon/addon/index.js');
      expect(file('dist/assets/vendor.css')).to.contain(
        'POSTPROCESSED node_modules/ember-top-addon/addon/styles/app.css'
      );

      // the pre/post process tree hooks above should *not* have changed RAW's in the current app
      expect(file('dist/assets/some-cool-app.js')).to.contain('RAW app/foo.js');

      // should *not* have changed RAW's in sibling addons
      expect(file('dist/assets/vendor.js')).to.contain(
        'RAW node_modules/ember-top-addon/node_modules/ember-inner-addon/addon/index.js'
      );
    });
  }
});
