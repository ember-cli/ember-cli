'use strict';

const Promise = require('../../lib/ext/promise');
const path = require('path');
const fs = require('fs-extra');
let remove = Promise.denodeify(fs.remove);
const spawn = require('child_process').spawn;
const chalk = require('chalk');

const symlinkOrCopySync = require('symlink-or-copy').sync;
const runCommand = require('../helpers/run-command');
const ember = require('../helpers/ember');
const copyFixtureFiles = require('../helpers/copy-fixture-files');
const killCliProcess = require('../helpers/kill-cli-process');
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
  });

  afterEach(function() {
    // Cleans up a folder set up on the other side of a symlink.
    fs.remove(path.join(addonRoot, 'node_modules', 'developing-addon'));

    cleanupRun(addonName);
    expect(dir(addonRoot)).to.not.exist;
  });

  it('generates package.json and bower.json with proper metadata', function() {
    let packageContents = fs.readJsonSync('package.json');

    expect(packageContents.name).to.equal(addonName);
    expect(packageContents.private).to.be.an('undefined');
    expect(packageContents.keywords).to.deep.equal(['ember-addon']);
    expect(packageContents['ember-addon']).to.deep.equal({ 'configPath': 'tests/dummy/config' });
    expect(packageContents.dependencies).to.be.an('object');
    expect(packageContents.dependencies['ember-cli-htmlbars']).to.be.a('string');

    let bowerContents = fs.readJsonSync('bower.json');

    expect(bowerContents.name).to.equal(addonName);
  });

  it('ember addon foo, clean from scratch', function() {
    return ember(['test']);
  });

  it('works in most common scenarios for an example addon', function() {
    return copyFixtureFiles('addon/kitchen-sink').then(function() {
      let packageJsonPath = path.join(addonRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);

      packageJson.dependencies = packageJson.dependencies || {};
      // add HTMLBars for templates (generators do this automatically when components/templates are added)
      packageJson.dependencies['ember-cli-htmlbars'] = 'latest';

      // build with addon deps being developed
      packageJson.dependencies['developing-addon'] = 'latest';

      fs.writeJsonSync(packageJsonPath, packageJson);

      symlinkOrCopySync(path.resolve('../../tests/fixtures/addon/developing-addon'), path.join(addonRoot, 'node_modules', 'developing-addon'));

      return runCommand('node_modules/ember-cli/bin/ember', 'build').then(function(result) {
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

        return runCommand('node_modules/ember-cli/bin/ember', 'test').then(function(result) {
          expect(result.code).to.eql(0);
        });
      });
    });
  });

  it('npm pack does not include unnecessary files', function() {
    let handleError = function(error, commandName) {
      if (error.code === 'ENOENT') {
        console.warn(chalk.yellow(`      Your system does not provide ${commandName} -> Skipped this test.`));
      } else {
        throw new Error(error);
      }
    };

    return new Promise(function(resolve, reject) {
      let npmPack = spawn('npm', ['pack']);
      npmPack.on('error', function(error) {
        reject(error);
      });
      npmPack.on('close', function() {
        resolve();
      });
    }).then(function() {
      return new Promise(function(resolve, reject) {
        let output;
        let tar = spawn('tar', ['-tf', `${addonName}-0.0.0.tgz`]);
        tar.on('error', function(error) {
          reject(error);
        });
        tar.stdout.on('data', function(data) {
          output = data.toString();
        });
        tar.on('close', function() {
          resolve(output);
        });
      }).then(function(output) {
        let unnecessaryFiles = [
          '.gitkeep',
          '.travis.yml',
          '.editorconfig',
          'testem.js',
          '.ember-cli',
          'bower.json',
          '.bowerrc',
        ];

        let unnecessaryFolders = [
          'tests/',
          'bower_components/',
        ];

        let outputFiles = output.split('\n');
        expect(outputFiles).to.not.contain(unnecessaryFiles);
        expect(outputFiles).to.not.contain(unnecessaryFolders);
      }, function(error) {
        handleError(error, 'tar');
      });
    }, function(error) {
      handleError(error, 'npm');
    });
  });
});
