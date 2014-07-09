'use strict';

var assert        = require('../../helpers/assert');
var MockUI        = require('../../helpers/mock-ui');
var UpdateChecker = require('../../../lib/models/update-checker');
var Promise       = require('../../../lib/ext/promise');

describe('Update Checker', function() {
  var ui;
  var versionConfig;

  beforeEach(function() {
    ui = new MockUI();
    versionConfig = {
      store: {},
      get: function(key) {
        return this.store[key];
      },
      set: function(key, val) {
        this.store[key] = val;
      }
    };
  });

  it('returns { updatedNeeded: false } if no update is needed', function() {
    var updateChecker = new UpdateChecker(ui, {
      checkForUpdates: true
    }, '0.0.5');

    // overwrite doCheck so it ignores any existing configstore
    updateChecker.doCheck = (function() {
        var doCheck = updateChecker.doCheck;

        return function() {
          updateChecker.versionConfig = versionConfig;
          return doCheck.apply(this);
        };
      }());

    updateChecker.checkNPM = function() {
      return Promise.resolve('0.0.1');
    };

    return updateChecker.checkForUpdates().then(function(updateInfo) {
      assert.isFalse(updateInfo.updateNeeded, 'updateNeeded should be false');
    });
  });

  it('says \'A new version of ember-cli is available\' if an update is needed', function() {
    var updateChecker = new UpdateChecker(ui, {
      checkForUpdates: true
    }, '0.0.1');

    // overwrite doCheck so it ignores any existing configstore
    updateChecker.doCheck = (function() {
        var doCheck = updateChecker.doCheck;

        return function() {
          updateChecker.versionConfig = versionConfig;
          return doCheck.apply(this, arguments);
        };
      }());

    updateChecker.checkNPM = function() {
      return Promise.resolve('1000.0.0');
    };

    return updateChecker.checkForUpdates().then(function() {
      assert.include(ui.output, 'A new version of ember-cli is available');
    });
  });

  it('should not check if last check was less than a day ago', function() {
    var updateChecker = new UpdateChecker(ui, {
      checkForUpdates: true
    }, '0.0.1');

    var now = new Date().getTime();
    var npmCalled = false;

    updateChecker.doCheck = (function() {
        var doCheck = updateChecker.doCheck;

        return function() {
          updateChecker.versionConfig = versionConfig;
          versionConfig.set('lastVersionCheckAt', now - 86400);
          return doCheck.apply(this);
        };
      }());

    updateChecker.checkNPM = function() {
      npmCalled = true;
    };

    return updateChecker.checkForUpdates().then(function() {
      assert.isFalse(npmCalled, 'NPM should not be called if the last check was less than a day ago');
    });
  });

  it('should save version information in configstore if checking with npm', function() {
    var updateChecker = new UpdateChecker(ui, {
      checkForUpdates: true
    }, '0.0.1');

    updateChecker.versionConfig = versionConfig;
    updateChecker.saveVersionInformation('1000.0.0');

    var now = new Date().getTime();

    assert.equal(updateChecker.versionConfig.store.newestVersion, '1000.0.0', 'should store newest version in configstore');
    assert.closeTo(updateChecker.versionConfig.store.lastVersionCheckAt, now, 100, 'should store lastVersionCheckAt in configstore');
  });

});
