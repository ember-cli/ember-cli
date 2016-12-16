'use strict';

var calculateCacheKeyForTree = require('../../../lib/utilities/addon-calculate-cache-key-for-tree');
var chai = require('../../chai');
var expect = chai.expect;

describe('calculateCacheKeyForTree', function() {
  it('should return same value for same input', function() {
    var addon = {
      root: 'hoy',
      pkg: { some: 'parsed', value: { goes: 'here' }}
    };

    var first = calculateCacheKeyForTree('app', addon);
    var second = calculateCacheKeyForTree('app', addon);

    expect(first).to.equal(second);
  });

  it('should return different value for different addons', function() {
    var firstAddon = {
      name: 'derp',
      root: 'hoy',
      pkg: { some: 'other', value: { goes: 'elsewhere' }}
    };

    var secondAddon = {
      name: 'huzzah',
      root: 'hoy',
      pkg: { some: 'parsed', value: { goes: 'here' }}
    };

    var first = calculateCacheKeyForTree('app', firstAddon);
    var second = calculateCacheKeyForTree('app', secondAddon);

    expect(first).to.not.equal(second);
  });

  it('should not return same value for same addon with different tree type', function() {
    var addon = {
      root: 'hoy',
      pkg: { some: 'parsed', value: { goes: 'here' }}
    };

    var first = calculateCacheKeyForTree('addon', addon);
    var second = calculateCacheKeyForTree('app', addon);

    expect(first).not.to.equal(second);
  });
});
