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
var killCliProcess   = require('../helpers/kill-cli-process');

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

        // Need to junction on windows since we likely don't have persmission to symlink
        // 3rd arg is ignored on systems other than windows
        fs.symlinkSync(path.join(pwd, '..'), appsECLIPath, 'junction');
        process.chdir(addonName);
      });
  });

  afterEach(function() {
    this.timeout(15000);

    assertTmpEmpty();
    return tmp.teardown('./tmp');
  });

  it('generates package.json and bower.json with proper metadata', function() {
    var packageContents = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf8' }));

    assert.equal(packageContents.name, addonName);
    assert.equal(packageContents.private, undefined);
    assert.deepEqual(packageContents.keywords, ['ember-addon']);
    assert.deepEqual(packageContents['ember-addon'], { 'configPath': 'tests/dummy/config' });

    var bowerContents = JSON.parse(fs.readFileSync('bower.json', { encoding: 'utf8' }));

    assert.equal(bowerContents.name, addonName);
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

        assert(contents.indexOf('"SOME AWESOME STUFF"') > -1);
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

        assert(contents.indexOf('addon/styles/app.css is present') > -1);
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

        assert(contents.indexOf('tests/dummy/public/robots.txt is present') > -1);
      });
  });
});
