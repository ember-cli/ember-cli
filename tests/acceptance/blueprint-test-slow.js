'use strict';

var tmp        = require('../helpers/tmp');
var conf       = require('../helpers/conf');
var Promise    = require('../../lib/ext/promise');
var path       = require('path');
var rimraf     = Promise.denodeify(require('rimraf'));
var fs         = require('fs');
var ncp        = Promise.denodeify(require('ncp'));
var assert     = require('assert');

var runCommand       = require('../helpers/run-command');

var appName  = 'some-cool-app';

function buildApp(appName) {
  return runCommand(path.join('..', 'bin', 'ember'), 'new', appName, {
    onOutput: function() {
      return; // no output for initial application build
    }
  });
}

describe('Acceptance: blueprint smoke tests', function() {
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
    this.timeout(10000);

    tmp.teardown('./tmp');
  });

  it('generating an http-proxy installs packages to package.json', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(450000);

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'generate', 'http-proxy', 'api', 'http://localhost/api')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = require(packageJsonPath);

        assert(packageJson.devDependencies['http-proxy']);
        assert(packageJson.devDependencies['connect-restreamer']);
      });
  });
});
