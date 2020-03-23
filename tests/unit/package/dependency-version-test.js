'use strict';

const assertVersionLock = require('../../helpers/assert-version-lock');

describe('dependencies', function () {
  let pkg;

  describe('in package.json', function () {
    before(function () {
      pkg = require('../../../package.json');
    });

    it('are locked down for pre-1.0 versions', function () {
      assertVersionLock(pkg.dependencies);
      assertVersionLock(pkg.devDependencies);
    });
  });
});
