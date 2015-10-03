'use strict';
/* global xit */

var ember       = require('../helpers/ember');
var expect      = require('chai').expect;
var path        = require('path');
var tmp         = require('../helpers/tmp');
var conf        = require('../helpers/conf');
var root        = process.cwd();
var existsSync  = require('exists-sync');
var fs          = require('fs');
var _           = require('lodash');

var appName = 'clean-me';
var customBowerDir = 'bower-lib';

describe('Acceptance: ember clean', function() {
  this.timeout(20000);

  before(function() {
    conf.setup();
  });

  after(function() {
    conf.restore();
  });

  function updateBowerrc(settings) {
    var bowerrcPath = path.join(root, 'tmp', appName, '.bowerrc');
    var bowerrc = JSON.parse(fs.readFileSync(bowerrcPath));
    var updated = _.merge(bowerrc, settings);

    return fs.writeFileSync(bowerrcPath, JSON.stringify(updated));
  }

  function initApp(appName) {
    return ember([
      'new',
      appName,
      '--skip-npm',
      '--skip-bower'
    ])
    .then(function() {
        var bowerCachePath = path.join(root, 'tmp/bower-cache');
        return updateBowerrc({
          storage: {
            packages : path.join(bowerCachePath, 'packages'),
            registry : path.join(bowerCachePath, 'registry'),
            links : path.join(bowerCachePath, 'links')
          }
        });
    })
    .then(function() {
        var npmrcPath = path.join(root, 'tmp', appName, '.npmrc');
        var npmCachePath = path.join(root, 'tmp/npm-cache');

        return fs.writeFileSync(npmrcPath, 'cache = ' + npmCachePath);
    });
  }

  function assertFileNotExists(file) {
    var filePath = path.join(process.cwd(), file);
    expect(!existsSync(filePath), 'expected ' + file + ' not to exist');
  }

  function assertFileExists(file) {
    var filePath = path.join(process.cwd(), file);
    expect(existsSync(filePath), 'expected ' + file + ' to exist');
  }

  beforeEach(function() {
    return tmp.setup('./tmp')
      // possibly `acceptance.createTestTargets()` should be used instead
      .then(function() {
        process.chdir('./tmp');
        return initApp(appName);
      })
      .then(function() {
        return tmp.setup(path.join('tmp', appName, 'tmp'));
      }).then(function() {
        return tmp.setup(path.join('tmp', appName, 'dist'));
      }).then(function() {
        return tmp.setup(path.join('tmp', appName, customBowerDir));
      }).then(function() {
        return tmp.setup(path.join('tmp', appName, 'bower_components'));
      }).then(function() {
        return tmp.setup(path.join('tmp', appName, 'node_modules'));
      });
  });

  afterEach(function() {
    process.chdir(root);
    return tmp.teardown('./tmp');
  });

  it('all', function() {
    process.chdir('./tmp/' + appName);

    return ember(['clean']).then(function() {
      assertFileNotExists('tmp');
      assertFileNotExists('dist');
      assertFileNotExists('bower_components');
      assertFileNotExists('node_modules/');
    });
  });

  it('skip npm', function() {
    process.chdir('./tmp/' + appName);

    return ember([
      'clean',
      '--skip-npm'
    ]).then(function() {
      assertFileNotExists('tmp');
      assertFileNotExists('dist');
      assertFileNotExists('bower_components');
      assertFileExists('node_modules/');
    });
  });

  // @todo: Fix cache settings .npmrc
  // Currently looks like lib/utilities/npm doesn't take it in account
  // which causes global cache clean
  xit('skip bower', function() {
    process.chdir('./tmp/' + appName);
    return ember([
      'clean',
      '--skip-bower'
    ]).then(function() {
      assertFileNotExists('tmp');
      assertFileNotExists('dist');
      assertFileNotExists('node_modules');
      assertFileExists('bower_components');
    });
  });

  it('custom bower directory', function() {
    process.chdir('./tmp/' + appName);

    updateBowerrc({
      directory: customBowerDir
    });

    return ember([
      'clean',
      '--skip-npm'
    ]).then(function() {
      assertFileNotExists('tmp');
      assertFileNotExists('dist');
      assertFileNotExists(customBowerDir);
      assertFileExists('bower_components');
      assertFileExists('node_modules/');
    });
  });
});


