'use strict';

var tmp        = require('../helpers/tmp');
var conf       = require('../helpers/conf');
var Promise    = require('../../lib/ext/promise');
var path       = require('path');
var rimraf     = Promise.denodeify(require('rimraf'));
var fs         = require('fs');
var assert     = require('assert');
var walkSync   = require('walk-sync');
var addonName  = 'some-cool-addon';
var ncp        = Promise.denodeify(require('ncp'));
var EOL        = require('os').EOL;

var runCommand       = require('../helpers/run-command');
var buildApp         = require('../helpers/build-app');
var copyFixtureFiles = require('../helpers/copy-fixture-files');

function assertTmpEmpty() {
  if (!fs.existsSync('tmp')) {
    return;
  }

  var paths = walkSync('tmp')
    .filter(function(path) {
      return !path.match(/output\//);
    });

  assert(paths.length === 0, 'tmp/ should be empty after `ember` tasks. Contained: ' + paths.join(EOL));
}

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

        fs.symlinkSync(path.join(pwd, '..'), appsECLIPath);

        process.chdir(addonName);
      });
  });

  afterEach(function() {
    this.timeout(15000);

    assertTmpEmpty();
    return tmp.teardown('./tmp');
  });

  it('uses the correct name in generated package.json', function() {
    console.log('    running the slow end-to-end it will take some time');

    var contents = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf8' }));

    assert.equal(contents.name, addonName);
    assert.equal(contents.private, undefined);
  });

  it('ember addon foo, clean from scratch', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(450000);

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
  });

  it('ember addon without addon/ directory', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(450000);

    return rimraf('addon')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'server', '--port=54323','--live-reload=false', {
          onOutput: function(string, process) {
            if (string.match(/Build successful/)) {
              process.kill('SIGINT');
            }
          }
        })
        .catch(function() {
          // just eat the rejection as we are testing what happens
        });
      });
  });

  it('can render a component with a manually imported template', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(450000);

    return copyFixtureFiles('addon/component-with-template')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
      });
  });

});
