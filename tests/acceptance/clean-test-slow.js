'use strict';
/* global xit */

var ember               = require('../helpers/ember');
var expect              = require('chai').expect;
var assert              = require('../helpers/assert');
var path                = require('path');
var assertDirEmpty      = require('../helpers/assert-dir-empty');
var existsSync          = require('exists-sync');
var npmUtil             = require('../../lib/utilities/npm');
var Promise             = require('../../lib/ext/promise');
var npmUtil             = require('../../lib/utilities/npm');
var bowerUtil           = require('../../lib/utilities/bower');
var acceptance          = require('../helpers/acceptance');
var createTestTargets   = acceptance.createTestTargets;
var teardownTestTargets = acceptance.teardownTestTargets;
var linkDependencies    = acceptance.linkDependencies;
var cleanupRun          = acceptance.cleanupRun;

var appName = 'clean-me',
  npmCachePath = '../.npm-cache',
  bowerCachePath = '../.bower-cache',
  npmPackage = 'ember-can';

describe('Acceptance: ember clean', function() {
  this.timeout(450000);

  function absolutizePath(filePath) {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }

    return path.join(process.cwd(), filePath);
  }

  function pathExists(filePath) {
    filePath = absolutizePath(filePath);
    return existsSync(filePath);
  }

  function assertFileNotExists(file) {
    expect(pathExists(file)).to.be.equal(false, 'expected ' + file + ' not to exist');
  }

  function assertFileExists(file) {
    expect(pathExists(file)).to.be.equal(true, 'expected ' + file + ' to exist');
  }

  function assertNoBowerCache() {
    var bowerCacheLength = bowerUtil('cache list').then(function(list) {
      return list.length;
    });

    assert.eventually.equal(bowerCacheLength, 0, 'bower cache is empty');
  }

  function assertHasBowerCache() {
    var bowerCacheLength = bowerUtil('cache list').then(function(list) {
      return list.length;
    });

    assert.eventually.notEqual(bowerCacheLength, 0, 'bower cache remains fulfilled');
  }

  // function assertNoNpmCache() {
  //   var npmPackageCache = npmUtil('cache read', npmPackage);
  //
  //   return assert.eventually.isNotObject(npmPackageCache, 'npm cache is empty');
  // }
  //
  // function assertHasNpmCache() {
  //   var npmPackageCache = npmUtil('cache read', npmPackage);
  //
  //   return assert.eventually.isObject(npmPackageCache, 'has npm cache');
  // }
  //

  before(function() {
    return createTestTargets(appName, {
      command: 'new'
    })
    .then(function() {
        bowerCachePath = path.normalize('../.bower-cache');
        process.env['bower_storage__packages'] = path.join(bowerCachePath, 'packages');
        process.env['bower_storage__registry'] = path.join(bowerCachePath, 'registry');
        process.env['bower_storage__links'] = path.join(bowerCachePath, 'links');
    })
    .then(function() {
        npmCachePath = path.normalize('../.npm-cache');

        process.env['npm_config_cache'] = npmCachePath;
    });
  });

  after(function() {
    return teardownTestTargets();
  });

  beforeEach(function() {
    return linkDependencies(appName)
      .then(function() {
        Promise.all([
          bowerUtil('install', [ 'underscore' ]),
          npmUtil('install', npmPackage)
        ]);
      });
  });

  afterEach(function() {
    return cleanupRun().then(function() {
      assertDirEmpty('tmp');
    });
  });

  xit('all', function() {
    ember(['clean']).then(function() {
      assertFileNotExists('tmp');
      assertFileNotExists('dist');
      assertFileNotExists('bower_components');
      assertFileNotExists('node_modules/');

      expect(pathExists(npmCachePath)).to.be.equal(false, 'expected npm cache not to exist');
      expect(pathExists(bowerCachePath)).to.be.equal(false, 'expected bower cache not to exist');

      assertNoBowerCache();
    });
  });

  it('skip npm', function() {
    return ember([
      'clean',
      '--skip-npm'
    ]).then(function() {
      assertFileNotExists('tmp');
      assertFileNotExists('dist');
      assertFileNotExists('bower_components');
      assertFileExists('node_modules/');

      assertHasBowerCache();
        // assertHasNpmCache()
    });
  });

  it('skip bower and npm', function() {
    return ember([
      'clean',
      '--skip-npm',
      '--skip-bower'
    ]).then(function() {
      assertFileNotExists('tmp');
      assertFileNotExists('dist');

      assertFileExists('bower_components');
      assertFileExists('node_modules');

      assertHasBowerCache();
        // assertHasNpmCache()
    });
  });
});

