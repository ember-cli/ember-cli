'use strict';

var tmp      = require('../helpers/tmp');
var conf     = require('../helpers/conf');
var Promise  = require('../../lib/ext/promise');
var path     = require('path');
var rimraf   = Promise.denodeify(require('rimraf'));
var fs       = require('fs');
var assert   = require('assert');
var walkSync = require('walk-sync');
var appName  = 'some-cool-app';
var ncp      = Promise.denodeify(require('ncp'));

var runCommand       = require('../helpers/run-command');
var copyFixtureFiles = require('../helpers/copy-fixture-files');

function assertTmpEmpty() {
  var paths = walkSync('tmp')
    .filter(function(path) {
      return !path.match(/output\//);
    });

  assert(paths.length === 0, 'tmp/ should be empty after `ember` tasks. Contained: ' + paths.join('\n'));
}

function buildApp(appName) {
  return runCommand(path.join('..', 'bin', 'ember'), 'new', appName, {
    onOutput: function() {
      return; // no output for initial application build
    }
  });
}

describe('Acceptance: build-test', function() {
  before(function() {
    this.timeout(360000);

    tmp.setup('./common-tmp');
    process.chdir('./common-tmp');

    conf.setup();
    return buildApp(appName)
      .then(function() {
        return rimraf(path.join(appName, 'node_modules', 'ember-cli'));
      });
  });

  after(function() {
    tmp.teardown('./common-tmp');
    conf.restore();
  });

  beforeEach(function() {
    this.timeout(10000);
    tmp.setup('./tmp');
    return ncp('./common-tmp/' + appName, './tmp/' + appName, {
      clobber: true,
      stopOnErr: true
    })
    .then(function() {
      process.chdir('./tmp');

      var appsECLIPath = path.join(appName, 'node_modules', 'ember-cli');
      var pwd = process.cwd();

      fs.symlinkSync(path.join(pwd, '..'), appsECLIPath);

      process.chdir(appName);
    });
  });

  afterEach(function() {
    assertTmpEmpty();
    tmp.teardown('./tmp');
  });

  it('ember new foo, build production and verify css files are concatenated', function() {
    this.timeout(360000);
    return copyFixtureFiles('with-styles')
      .then(function() {
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--environment=production')
        .then(function() {
          var dirPath = path.join('.', 'dist', 'assets');
          var dir = fs.readdirSync(dirPath);
          var cssNameRE = new RegExp(appName + '-([a-f0-9]+)\\.css','i');
          dir.forEach(function (filepath) {
            if(cssNameRE.test(filepath)) {
              var appCss = fs.readFileSync(path.join('.', 'dist', 'assets', filepath), { encoding: 'utf8' });
              assert(appCss.indexOf('.some-weird-selector')>-1);
              assert(appCss.indexOf('.some-even-weirder-selector')>-1);
            }
          });
        });
    });
  });
});