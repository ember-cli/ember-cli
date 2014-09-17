'use strict';

var tmp        = require('../helpers/tmp');
var conf       = require('../helpers/conf');
var Promise    = require('../../lib/ext/promise');
var path       = require('path');
var rimraf     = Promise.denodeify(require('rimraf'));
var fs         = require('fs');
var ncp        = Promise.denodeify(require('ncp'));
var assert     = require('assert');

var buildApp         = require('../helpers/build-app');
var runCommand       = require('../helpers/run-command');

var appName  = 'some-cool-app';

describe('Acceptance: blueprint smoke tests', function() {
  before(function() {
    this.timeout(360000);

    return tmp.setup('./common-tmp')
      .then(function() {
        process.chdir('./common-tmp');

        conf.setup();
        return buildApp(appName)
          .then(function() {
            return rimraf(path.join(appName, 'node_modules', 'ember-cli'));
          });
      });
  });

  after(function() {
    return tmp.teardown('./common-tmp')
      .then(function() {
        conf.restore();
      });
  });

  beforeEach(function() {
    this.timeout(10000);
    return tmp.setup('./tmp')
      .then(function() {
        return ncp('./common-tmp/' + appName, './tmp/' + appName, {
          clobber: true,
          stopOnErr: true
        });
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

    return tmp.teardown('./tmp');
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
