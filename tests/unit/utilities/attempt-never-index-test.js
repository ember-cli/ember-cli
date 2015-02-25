'use strict';

var attemptNeverIndex= require('../../../lib/utilities/attempt-never-index');
var quickTemp = require('quick-temp');
var fs = require('fs-extra');
var expect = require('chai').expect;
var isDarwin = /darwin/i.test(require('os').type());

describe('attempt-never-index', function() {
  var context = {};
  var tmpPath;
  before(function() {
    tmpPath = quickTemp.makeOrRemake(context, 'attempt-never-index');
  });

  after(function() {
    quickTemp.remove(context, 'attempt-never-index');
  });

  it('sets the hint to spotlight if possible', function() {
    expect(fs.existsSync(tmpPath + '/.metadata_never_index')).to.false;

    attemptNeverIndex(tmpPath);

    if (isDarwin) {
      expect(fs.existsSync(tmpPath + '/.metadata_never_index')).to.true;
    } else {
      expect(fs.existsSync(tmpPath + '/.metadata_never_index')).to.false;
    }
  });
});
