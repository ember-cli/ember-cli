'use strict';

var expect = require('chai').expect;
var checkValidPlatform = require('../../../lib/utilities/valid-platform-version');

describe('platform-version-check', function() {

  it('should return true if running on iojs', function() {
    expect(checkValidPlatform('v1.0.0')).to.be.equal(true);
    expect(checkValidPlatform('v1.0.1')).to.be.equal(true);
    expect(checkValidPlatform('v1.0.2')).to.be.equal(true);
    expect(checkValidPlatform('v1.0.3')).to.be.equal(true);
    expect(checkValidPlatform('v1.0.4')).to.be.equal(true);
    expect(checkValidPlatform('v1.1.0')).to.be.equal(true);
    expect(checkValidPlatform('v1.2.0')).to.be.equal(true);
  });

  it('should return false if running on node v0.10', function() {
    expect(checkValidPlatform('v0.10.1')).to.be.equal(false);
    expect(checkValidPlatform('v0.10.15')).to.be.equal(false);
    expect(checkValidPlatform('v0.10.30')).to.be.equal(false);
  });

  it('should return true if running on node v0.12', function() {
    expect(checkValidPlatform('v0.12.0')).to.be.equal(true);
    expect(checkValidPlatform('v0.12.15')).to.be.equal(true);
    expect(checkValidPlatform('v0.12.30')).to.be.equal(true);
  });

  it('should return true if running on node v0.13', function() {
    expect(checkValidPlatform('v0.13.0')).to.be.equal(true);
    expect(checkValidPlatform('v0.13.15')).to.be.equal(true);
    expect(checkValidPlatform('v0.13.30')).to.be.equal(true);
  });
});
