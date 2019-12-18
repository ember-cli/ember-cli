'use strict';

const Promise = require('rsvp').Promise;
const path = require('path');
const fs = require('fs-extra');
const spawn = require('child_process').spawn;
const chalk = require('chalk');

const { isExperimentEnabled } = require('../../lib/experiments');
const runCommand = require('../helpers/run-command');
const ember = require('../helpers/ember');
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

describe('Acceptance: addon-smoke-test', function() {
  this.timeout(450000);

  before(function() {
    return createTestTargets(addonName, {
      command: 'addon',
    });
  });

  after(teardownTestTargets);

  beforeEach(function() {
    addonRoot = linkDependencies(addonName);

    process.env.JOBS = '1';
  });

  afterEach(function() {
    // Cleans up a folder set up on the other side of a symlink.
    fs.removeSync(path.join(addonRoot, 'node_modules', 'developing-addon'));

    cleanupRun(addonName);
    expect(dir(addonRoot)).to.not.exist;

    delete process.env.JOBS;
  });

  if (!isExperimentEnabled('MODULE_UNIFICATION')) {
    it('generates package.json with proper metadata', function() {
      let packageContents = fs.readJsonSync('package.json');

      expect(packageContents.name).to.equal(addonName);
      expect(packageContents.private).to.be.an('undefined');
      expect(packageContents.keywords).to.deep.equal(['ember-addon']);
      expect(packageContents['ember-addon']).to.deep.equal({ configPath: 'tests/dummy/config' });
    });

    it('ember addon foo, clean from scratch', function() {
      return ember(['test']);
    });

    it('works in most common scenarios for an example addon', async function() {
      await copyFixtureFiles('addon/kitchen-sink');

      let packageJsonPath = path.join(addonRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);

      expect(packageJson.devDependencies['ember-source']).to.not.be.empty;

      packageJson.dependencies = packageJson.dependencies || {};
      // add HTMLBars for templates (generators do this automatically when components/templates are added)
      packageJson.dependencies['ember-cli-htmlbars'] = 'latest';

      fs.writeJsonSync(packageJsonPath, packageJson);

      let result = await runCommand('node_modules/ember-cli/bin/ember', 'build');

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

      result = await runCommand('node_modules/ember-cli/bin/ember', 'test');

      expect(result.code).to.eql(0);
    });

    it('npm pack does not include unnecessary files', async function() {
      let handleError = function(error, commandName) {
        if (error.code === 'ENOENT') {
          console.warn(chalk.yellow(`      Your system does not provide ${commandName} -> Skipped this test.`));
        } else {
          throw new Error(error);
        }
      };

      try {
        await npmPack();
      } catch (error) {
        return handleError(error, 'npm');
      }

      let output;
      try {
        output = await tar();
      } catch (error) {
        return handleError(error, 'tar');
      }

      let necessaryFiles = ['package.json', 'index.js', 'LICENSE.md', 'README.md', 'config/environment.js'];

      let unnecessaryFiles = [
        '.gitkeep',
        '.travis.yml',
        '.editorconfig',
        'testem.js',
        '.ember-cli',
        'bower.json',
        '.bowerrc',
      ];

      let unnecessaryFolders = [/^tests\//, /^bower_components\//];

      let outputFiles = output
        .split('\n')
        .filter(Boolean)
        .map(f => f.replace(/^package\//, ''));

      expect(outputFiles, 'verify our assumptions about the output structure').to.include.members(necessaryFiles);

      expect(outputFiles).to.not.have.members(unnecessaryFiles);

      for (let unnecessaryFolder of unnecessaryFolders) {
        for (let outputFile of outputFiles) {
          expect(outputFile).to.not.match(unnecessaryFolder);
        }
      }
    });
  }
});

function npmPack() {
  return new Promise((resolve, reject) => {
    let npmPack = spawn('npm', ['pack']);
    npmPack.on('error', reject);
    npmPack.on('close', () => resolve());
  });
}

function tar() {
  return new Promise((resolve, reject) => {
    let output;
    let fileName = `${addonName}-0.0.0.tgz`;
    if (fs.existsSync(fileName) === false) {
      throw new Error(`unknown file: '${path.resolve(fileName)}'`);
    }
    let tar = spawn('tar', ['-tf', fileName]);
    tar.on('error', reject);
    tar.stdout.on('data', data => (output = data.toString()));
    tar.on('close', () => resolve(output));
  });
}
