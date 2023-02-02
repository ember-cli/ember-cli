'use strict';

const path = require('path');
const fs = require('fs-extra');

const runCommand = require('../helpers/run-command');
const acceptance = require('../helpers/acceptance');
const copyFixtureFiles = require('../helpers/copy-fixture-files');
const DistChecker = require('../helpers/dist-checker');
let createTestTargets = acceptance.createTestTargets;
let teardownTestTargets = acceptance.teardownTestTargets;
let linkDependencies = acceptance.linkDependencies;
let cleanupRun = acceptance.cleanupRun;

const { expect } = require('chai');
const { dir } = require('chai-files');

let appName = 'some-cool-app';
let appRoot;

describe('Acceptance: nested-addons-smoke-test', function () {
  this.timeout(360000);

  before(function () {
    return createTestTargets(appName);
  });

  after(teardownTestTargets);

  beforeEach(function () {
    appRoot = linkDependencies(appName);
  });

  afterEach(function () {
    runCommand.killAll();
    cleanupRun(appName);
    expect(dir(appRoot)).to.not.exist;
  });

  it('addons with nested addons compile correctly', async function () {
    await copyFixtureFiles('addon/with-nested-addons');

    let packageJsonPath = path.join(appRoot, 'package.json');
    let packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.devDependencies['ember-top-addon'] = 'latest';
    fs.writeJsonSync(packageJsonPath, packageJson);

    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let checker = new DistChecker(path.join(appRoot, 'dist'));

    expect(checker.contains('js', 'INNER_ADDON_IMPORT_WITH_APP_IMPORT')).to.be;
    expect(checker.contains('js', 'INNER_ADDON_IMPORT_WITH_THIS_IMPORT')).to.be;

    // RAW comments should have been converted to PREPROCESSED by
    // tests/fixtures/addon/with-nested-addons/node_modules/ember-top-addon/node_modules/preprocesstree-addon
    // then from PREPROCESSED to POSTPROCESSED by
    // tests/fixtures/addon/with-nested-addons/node_modules/ember-top-addon/node_modules/postprocesstree-addon
    expect(checker.contains('js', 'POSTPROCESSED node_modules/ember-top-addon/addon/templates/application.hbs')).to.be;
    expect(checker.contains('js', 'POSTPROCESSED node_modules/ember-top-addon/addon/index.js')).to.be;
    expect(checker.contains('css', 'POSTPROCESSED node_modules/ember-top-addon/addon/styles/app.css')).to.be;

    // the pre/post process tree hooks above should *not* have changed RAW's in the current app
    expect(checker.contains('js', 'RAW app/foo.js')).to.be;

    // should *not* have changed RAW's in sibling addons
    expect(checker.contains('js', 'RAW node_modules/ember-top-addon/node_modules/ember-inner-addon/addon/index.js')).to
      .be;
  });
});
