'use strict';

const expect = require('chai').expect;
const PlatformChecker = require('../../../lib/utilities/platform-checker');

describe('platform-checker', function () {
  describe('known versions', function () {
    function check(version, { isTested, isDeprecated, isValid }) {
      it(`${version}`, function () {
        let checker = new PlatformChecker(version);
        expect(checker.isDeprecated).to.equal(isDeprecated);
        expect(checker.isValid).to.equal(isValid);
        expect(checker.isTested).to.equal(isTested);
      });
    }

    check('v8.0.0', { isTested: false, isDeprecated: true, isValid: false });
    check('v10.0.0', { isTested: true, isDeprecated: false, isValid: true });
    check('v12.0.0', { isTested: true, isDeprecated: false, isValid: true });
    check('v13.0.0', { isTested: false, isDeprecated: false, isValid: true });
    check('v14.0.0', { isTested: true, isDeprecated: false, isValid: true });
    check('v15.0.0', { isTested: false, isDeprecated: false, isValid: true });
  });

  it('checkIsDeprecated', function () {
    expect(new PlatformChecker('v0.10.1').checkIsDeprecated('4 || 6')).to.be.equal(
      true,
      'versions below the range are deprecated'
    );
    expect(new PlatformChecker('v4.5.0').checkIsDeprecated('4 || 6')).to.be.equal(
      false,
      'versions in the range are not deprecated'
    );
    expect(new PlatformChecker('4.5.0').checkIsDeprecated('4 || 6')).to.be.equal(
      false,
      'versions without a v prefix recognize correctly'
    );
    expect(new PlatformChecker('v9.0.0').checkIsDeprecated('4 || 6')).to.be.equal(
      false,
      'versions above the range are not deprecated'
    );
  });

  it('checkIsValid', function () {
    expect(new PlatformChecker('v0.10.1').checkIsValid('4 || 6')).to.be.equal(
      false,
      'versions below the range are not valid'
    );
    expect(new PlatformChecker('v4.5.0').checkIsValid('4 || 6')).to.be.equal(true, 'versions in the range are valid');
    expect(new PlatformChecker('v4.6.0').checkIsValid('^4.5')).to.be.equal(true, 'LTS "minor" pattern works.');
    expect(new PlatformChecker('v9.0.0').checkIsValid('4 || 6')).to.be.equal(
      true,
      'versions above the range are valid'
    );
  });

  it('checkIsTested', function () {
    expect(new PlatformChecker('v0.10.1').checkIsTested('4 || 6')).to.be.equal(
      false,
      'versions not in range are untested'
    );
    expect(new PlatformChecker('v9.0.0').checkIsTested('4 || 6')).to.be.equal(
      false,
      'versions not in range are untested'
    );
    expect(new PlatformChecker('v4.5.0').checkIsTested('4 || 6')).to.be.equal(true, 'versions in the range are valid');
  });
});
