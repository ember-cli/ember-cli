'use strict';

var tmp        = require('../helpers/tmp');
var conf       = require('../helpers/conf');
var Promise    = require('../../lib/ext/promise');
var path       = require('path');
var rimraf     = Promise.denodeify(require('rimraf'));
var fs         = require('fs');
var expect     = require('chai').expect;
var addonName  = 'some-cool-addon';
var ncp        = Promise.denodeify(require('ncp'));
var Promise    = require('../../lib/ext/promise');
var spawn      = require('child_process').spawn;
var chalk      = require('chalk');
var expect     = require('chai').expect;

var runCommand       = require('../helpers/run-command');
var buildApp         = require('../helpers/build-app');
var copyFixtureFiles = require('../helpers/copy-fixture-files');
var killCliProcess   = require('../helpers/kill-cli-process');
var assertDirEmpty   = require('../helpers/assert-dir-empty');

describe('Acceptance: addon-smoke-test', function() {
  before(function() {
    this.timeout(360000);

    return tmp.setup('./common-tmp')
      .then(function() {
        process.chdir('./common-tmp');

        conf.setup();
        return buildApp(addonName, {
          command: 'addon'
        })
          .then(function() {
            return rimraf(path.join(addonName, 'node_modules', 'ember-cli'));
          });
      });
  });

  after(function() {
    this.timeout(15000);

    return tmp.teardown('./common-tmp')
      .then(function() {
        conf.restore();
      });
  });

  beforeEach(function() {
    this.timeout(15000);

    return tmp.setup('./tmp')
      .then(function() {
        return ncp('./common-tmp/' + addonName, './tmp/' + addonName, {
          clobber: true,
          stopOnErr: true
        });
      })
      .then(function() {
        process.chdir('./tmp');

        var appsECLIPath = path.join(addonName, 'node_modules', 'ember-cli');
        var pwd = process.cwd();

        // Need to junction on windows since we likely don't have persmission to symlink
        // 3rd arg is ignored on systems other than windows
        fs.symlinkSync(path.join(pwd, '..'), appsECLIPath, 'junction');
        process.chdir(addonName);
      });
  });

  afterEach(function() {
    this.timeout(15000);

    assertDirEmpty('tmp');
    return tmp.teardown('./tmp');
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

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test', '--silent');
  });

  it('ember addon without addon/ directory', function() {
    this.timeout(450000);

    return rimraf('addon')
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
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test', '--silent');
      });
  });

  it('can add things to `{{content-for "head"}}` section', function() {
    this.timeout(450000);

    return copyFixtureFiles('addon/content-for-head')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--silent');
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
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--silent');
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
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--silent');
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
