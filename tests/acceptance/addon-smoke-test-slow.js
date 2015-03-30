'use strict';

var Promise    = require('../../lib/ext/promise');
var path       = require('path');
var fs         = require('fs-extra');
var remove     = Promise.denodeify(fs.remove);
var expect     = require('chai').expect;
var addonName  = 'some-cool-addon';
var spawn      = require('child_process').spawn;
var chalk      = require('chalk');
var expect     = require('chai').expect;

var runCommand          = require('../helpers/run-command');
var copyFixtureFiles    = require('../helpers/copy-fixture-files');
var killCliProcess      = require('../helpers/kill-cli-process');
var assertDirEmpty      = require('../helpers/assert-dir-empty');
var acceptance          = require('../helpers/acceptance');
var createTestTargets   = acceptance.createTestTargets;
var teardownTestTargets = acceptance.teardownTestTargets;
var linkDependencies    = acceptance.linkDependencies;
var cleanupRun          = acceptance.cleanupRun;

describe('Acceptance: addon-smoke-test', function() {

  before(function() {
    this.timeout(360000);
    return createTestTargets(addonName, {
      command: 'addon'
    });
  });

  after(function() {
    this.timeout(360000);
    return teardownTestTargets();
  });

  beforeEach(function() {
    this.timeout(360000);
    return linkDependencies(addonName);
  });

  afterEach(function() {
    this.timeout(15000);
    return cleanupRun().then(function() {
      assertDirEmpty('tmp');
    });
  });

  it('generates package.json and bower.json with proper metadata', function() {
    var packageContents = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf8' }));

    expect(packageContents.name).to.equal(addonName);
    expect(packageContents.private).to.be.an('undefined');
    expect(packageContents.keywords).to.deep.equal([ 'ember-addon' ]);
    expect(packageContents['ember-addon']).to.deep.equal({ 'configPath': 'tests/dummy/config' });

    var bowerContents = JSON.parse(fs.readFileSync('bower.json', { encoding: 'utf8' }));

    expect(bowerContents.name).to.equal(addonName);
  });

  it('ember addon foo, clean from scratch', function() {
    this.timeout(450000);
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
  });

  it('ember addon without addon/ directory', function() {
    this.timeout(450000);

    return remove('addon')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'server', '--port=54323','--live-reload=false', {
          onOutput: function(string, child) {
            if (string.match(/Build successful/)) {
              killCliProcess(child);
            }
          }
        })
        .catch(function() {
          // just eat the rejection as we are testing what happens
        });
      });
  });

  it('can render a component with a manually imported template', function() {
    this.timeout(450000);

    return copyFixtureFiles('addon/component-with-template')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', addonName, 'package.json');
        var packageJson = require(packageJsonPath);
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.dependencies['ember-cli-htmlbars'] = 'latest';

        return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
      });
  });

  it('can add things to `{{content-for "head"}}` section', function() {
    this.timeout(450000);

    return copyFixtureFiles('addon/content-for-head')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        var indexPath = path.join('dist', 'index.html');
        var contents = fs.readFileSync(indexPath, { encoding: 'utf8' });

        expect(contents).to.contain('"SOME AWESOME STUFF"');
      });
  });

  it('ember addon with addon/styles directory', function() {
    this.timeout(450000);

    return copyFixtureFiles('addon/with-styles')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        var cssPath = path.join('dist', 'assets', 'vendor.css');
        var contents = fs.readFileSync(cssPath, { encoding: 'utf8' });

        expect(contents).to.contain('addon/styles/app.css is present');
      });
  });

  it('ember addon with tests/dummy/public directory', function() {
    this.timeout(450000);

    return copyFixtureFiles('addon/with-dummy-public')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        var robotsPath = path.join('dist', 'robots.txt');
        var contents = fs.readFileSync(robotsPath, { encoding: 'utf8' });

        expect(contents).to.contain('tests/dummy/public/robots.txt is present');
      });
  });

  it('npm pack does not include unnecessary files', function() {
    console.log('    running the slow end-to-end it will take some time');
    this.timeout(450000);

    var handleError = function(error, commandName) {
      if(error.code === 'ENOENT') {
        console.warn(chalk.yellow('      Your system does not provide ' + commandName + ' -> Skipped this test.'));
      } else {
        throw new Error(error);
      }
    };

    return new Promise(function(resolve, reject) {
      var npmPack = spawn('npm', ['pack']);
      npmPack.on('error', function(error) {
        reject(error);
      });
      npmPack.on('close', function() {
        resolve();
      });
    }).then(function() {
      return new Promise(function(resolve, reject) {
        var output;
        var tar = spawn('tar', ['-tf', addonName + '-0.0.0.tgz']);
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
        var unnecessaryFiles = ['.gitkeep', '.travis.yml', 'Brocfile.js', '.editorconfig', 'testem.json', '.ember-cli', 'bower.json', '.bowerrc'];
        var unnecessaryFolders = ['tests/', 'bower_components/'];

        unnecessaryFiles.concat(unnecessaryFolders).forEach(function(file) {
          expect(output).to.not.match(new RegExp(file), 'expected packaged addon to not contain file or folder \'' + file + '\'');
        });
      }, function(error) {
        handleError(error, 'tar');
      });
    }, function(error) {
      handleError(error, 'npm');
    });
  });
});
