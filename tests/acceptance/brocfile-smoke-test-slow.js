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
var copyFixtureFiles = require('../helpers/copy-fixture-files');

var appName  = 'some-cool-app';

function buildApp(appName) {
  return runCommand(path.join('..', 'bin', 'ember'), 'new', appName, {
    onOutput: function() {
      return; // no output for initial application build
    }
  });
}

describe('Acceptance: brocfile-smoke-test', function() {
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
    tmp.teardown('./tmp');
  });

  it('using wrapInEval: true', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(450000);

    return copyFixtureFiles('brocfile-tests/wrap-in-eval')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
      });
  });

  it('default development build tests', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(450000);

    return copyFixtureFiles('brocfile-tests/default-development')
    .then(function() {
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
    });
  });

  it('app.import works properly with non-js/css files', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(100000);

    return copyFixtureFiles('brocfile-tests/app-import')
    .then(function() {
      var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
      var packageJson = require(packageJsonPath);
      packageJson.devDependencies['ember-random-addon'] = 'latest';
      return Promise.denodeify(fs.writeFile)(packageJsonPath, JSON.stringify(packageJson));
    }).then(function() {
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', {
        verbose: true
      });
    }).then(function() {
      return Promise.denodeify(fs.readFile(path.join('.', 'dist', 'assets', 'file-to-import.txt')));
    }).then(function(subjectFileContents) {
      assert.equal(subjectFileContents, 'EXAMPLE TEXT FILE CONTENT');
    });
  });
});

