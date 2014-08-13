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

var runCommand       = require('../helpers/run-command');

function assertTmpEmpty() {
  var paths = walkSync('tmp')
    .filter(function(path) {
      return !path.match(/output\//);
    });

  assert(paths.length === 0, 'tmp/ should be empty after `ember` tasks. Contained: ' + paths.join('\n'));
}

function buildAddon(addonName) {
  return runCommand(path.join('..', 'bin', 'ember'), 'addon', addonName, {
    onOutput: function() {
      return; // no output for initial application build
    }
  });
}

describe('Acceptance: smoke-test', function() {
  before(function() {
    this.timeout(360000);

    tmp.setup('./common-tmp');
    process.chdir('./common-tmp');

    conf.setup();
    return buildAddon(addonName)
      .then(function() {
        return rimraf(path.join(addonName, 'node_modules', 'ember-cli'));
      });
  });

  after(function() {
    this.timeout(10000);

    tmp.teardown('./common-tmp');
    conf.restore();
  });

  beforeEach(function() {
    this.timeout(10000);
    tmp.setup('./tmp');
    return ncp('./common-tmp/' + addonName, './tmp/' + addonName, {
      clobber: true,
      stopOnErr: true
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
    this.timeout(10000);

    assertTmpEmpty();
    tmp.teardown('./tmp');
  });

  it('ember addon foo, clean from scratch', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(450000);

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
  });

});
