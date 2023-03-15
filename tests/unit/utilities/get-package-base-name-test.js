'use strict';

const { expect } = require('chai');
const getPackageBaseName = require('../../../lib/utilities/get-package-base-name');

describe('getPackageBaseName', function () {
  it('should return the full package name if it is unscoped', function () {
    expect(getPackageBaseName('my-addon')).to.equal('my-addon');
  });

  it('should return the full name when scoped', function () {
    expect(getPackageBaseName('@scope/my-addon')).to.equal('@scope/my-addon');
  });

  it('should strip away version numbers', function () {
    expect(getPackageBaseName('my-addon@~1.2.0')).to.equal('my-addon');
  });
});
