'use strict';

var expect       = require('chai').expect;
var pathUtils = require('../../../lib/utilities/path');

describe('path.getRelativeParentPath', function() {
  it('should return parent paths', function() {
    expect(pathUtils.getRelativeParentPath('')).to.equal('../');
    expect(pathUtils.getRelativeParentPath('foo')).to.equal('../');
    expect(pathUtils.getRelativeParentPath('foo/bar')).to.equal('../../');
    expect(pathUtils.getRelativeParentPath('foo/bar/baz')).to.equal('../../../');
  });

  it('should allow an offset value', function() {
    expect(pathUtils.getRelativeParentPath('',1)).to.equal('');
    expect(pathUtils.getRelativeParentPath('foo',1)).to.equal('');
    expect(pathUtils.getRelativeParentPath('foo/bar', 1)).to.equal('../');
    expect(pathUtils.getRelativeParentPath('foo/bar/baz', 2)).to.equal('../');
    expect(pathUtils.getRelativeParentPath('foo', -1)).to.equal('../../');
  });
  
  it('should have an optional trailing slash', function() {
    expect(pathUtils.getRelativeParentPath('', 0, false)).to.equal('..');
    expect(pathUtils.getRelativeParentPath('foo', 0, false)).to.equal('..');
    expect(pathUtils.getRelativeParentPath('foo/bar', 0, false)).to.equal('../..');
    expect(pathUtils.getRelativeParentPath('foo', 1, false)).to.equal('');
  });
});

describe('path.getRelativePath', function() {
  it('should return the relative path', function() {
    expect(pathUtils.getRelativePath('')).to.equal('./');
    expect(pathUtils.getRelativePath('foo')).to.equal('./');
    expect(pathUtils.getRelativePath('foo/bar')).to.equal('../');
    expect(pathUtils.getRelativePath('foo/bar/baz')).to.equal('../../');
  });

  it('should allow an offset value', function() {
    expect(pathUtils.getRelativePath('', 1)).to.equal('./');
    expect(pathUtils.getRelativePath('foo', 1)).to.equal('./');
    expect(pathUtils.getRelativePath('foo/bar', 1)).to.equal('./');
    expect(pathUtils.getRelativePath('foo/bar/baz', 1)).to.equal('../');
    expect(pathUtils.getRelativePath('foo/bar/baz', 2)).to.equal('./');
  });
});
