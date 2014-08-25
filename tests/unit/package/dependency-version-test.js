'use strict';

var assert = require('../../helpers/assert');
var semver = require('semver');

function assertVersionLock(deps) {
  deps = deps || {};

  Object.keys(deps).forEach(function(name) {
    if (name !== 'ember-cli' && semver.gtr('1.0.0', deps[name])) {
      // only valid if the version is fixed
      assert(semver.valid(deps[name]), '"' + name + '" has a valid version');
    }
  });
}

describe('dependencies', function() {
  var pkg;

  describe('in package.json', function() {
    before(function() {
      pkg = require('../../../package.json');
    });

    it('are locked down for pre-1.0 versions', function() {
      assertVersionLock(pkg.dependencies);
      assertVersionLock(pkg.devDependencies);
    });
  });

  describe('in blueprints/app/files/package.json', function() {
    before(function() {
      pkg = require('../../../blueprints/app/files/package.json');
    });

    it('are locked down for pre-1.0 versions', function() {
      assertVersionLock(pkg.dependencies);
      assertVersionLock(pkg.devDependencies);
    });
  });

  describe('in blueprints/addon/files/package.json', function() {
    before(function() {
      pkg = require('../../../blueprints/addon/files/package.json');
    });

    it('are locked down for pre-1.0 versions', function() {
      assertVersionLock(pkg.dependencies);
      assertVersionLock(pkg.devDependencies);
    });
  });
});
