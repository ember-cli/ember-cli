'use strict';

var Promise    = require('../../lib/ext/promise');
var path       = require('path');
var fs         = require('fs-extra');
var remove     = Promise.denodeify(fs.remove);
var addonName  = 'some-cool-addon';
var spawn      = require('child_process').spawn;
var chalk      = require('chalk');
var expect     = require('chai').expect;

var symlinkOrCopySync   = require('symlink-or-copy').sync;
var runCommand          = require('../helpers/run-command');
var ember               = require('../helpers/ember');
var copyFixtureFiles    = require('../helpers/copy-fixture-files');
var killCliProcess      = require('../helpers/kill-cli-process');
var assertDirEmpty      = require('../helpers/assert-dir-empty');
var acceptance          = require('../helpers/acceptance');
var createTestTargets   = acceptance.createTestTargets;
var teardownTestTargets = acceptance.teardownTestTargets;
var linkDependencies    = acceptance.linkDependencies;
var cleanupRun          = acceptance.cleanupRun;

describe('Acceptance: addon-smoke-test', function() {
  this.timeout(450000);

  before(function() {
    return createTestTargets(addonName, {
      command: 'addon'
    });
  });

  after(function() {
    return teardownTestTargets();
  });

  beforeEach(function() {
    return linkDependencies(addonName);
  });

  afterEach(function() {
    return cleanupRun().then(function() {
      assertDirEmpty('tmp');
    });
  });

  it('can add modules via `{{content-for "head"}}`', function() {
    return copyFixtureFiles('addon/content-for-head')
      .then(function() {
        return ember(['test']);
      })
      .then(function(result) {
        expect(result.exitCode).to.eql(0);
      });
  });

});
