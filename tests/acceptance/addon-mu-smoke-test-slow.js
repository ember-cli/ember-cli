'use strict';

const co = require('co');
const path = require('path');
const fs = require('fs-extra');

const { isExperimentEnabled } = require('../../lib/experiments');
const runCommand = require('../helpers/run-command');
const copyFixtureFiles = require('../helpers/copy-fixture-files');
const acceptance = require('../helpers/acceptance');
let createTestTargets = acceptance.createTestTargets;
let teardownTestTargets = acceptance.teardownTestTargets;
let linkDependencies = acceptance.linkDependencies;
let cleanupRun = acceptance.cleanupRun;

const chai = require('../chai');
let expect = chai.expect;
let dir = chai.dir;

let addonName = 'some-cool-addon';
let addonRoot;

if (isExperimentEnabled('MODULE_UNIFICATION')) {
  describe.skip('Acceptance: addon-mu-smoke-test', function() {
    this.timeout(450000);

    before(function() {
      return createTestTargets(addonName, {
        command: 'addon',
      });
    });

    after(teardownTestTargets);

    beforeEach(function() {
      addonRoot = linkDependencies(addonName);
    });

    afterEach(function() {
    // Cleans up a folder set up on the other side of a symlink.
      fs.remove(path.join(addonRoot, 'node_modules', 'developing-addon'));

      cleanupRun(addonName);
      expect(dir(addonRoot)).to.not.exist;
    });

    it('works in most common scenarios for an example addon', co.wrap(function *() {
      yield copyFixtureFiles('addon/kitchen-sink-mu');

      let packageJsonPath = path.join(addonRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);

      packageJson.dependencies = packageJson.dependencies || {};
      // add HTMLBars for templates (generators do this automatically when components/templates are added)
      packageJson.dependencies['ember-cli-htmlbars'] = 'latest';

      fs.writeJsonSync(packageJsonPath, packageJson);

      let result = yield runCommand('node_modules/ember-cli/bin/ember', 'build');

      expect(result.code).to.eql(0);
      let contents;

      let indexPath = path.join(addonRoot, 'dist', 'index.html');
      contents = fs.readFileSync(indexPath, { encoding: 'utf8' });
      expect(contents).to.contain('"SOME AWESOME STUFF"');

      let cssPath = path.join(addonRoot, 'dist', 'assets', 'vendor.css');
      contents = fs.readFileSync(cssPath, { encoding: 'utf8' });
      expect(contents).to.contain('addon/styles/app.css is present');

      let robotsPath = path.join(addonRoot, 'dist', 'robots.txt');
      contents = fs.readFileSync(robotsPath, { encoding: 'utf8' });
      expect(contents).to.contain('tests/dummy/public/robots.txt is present');

      result = yield runCommand('node_modules/ember-cli/bin/ember', 'test');

      expect(result.code).to.eql(0);
    }));
  });
}
