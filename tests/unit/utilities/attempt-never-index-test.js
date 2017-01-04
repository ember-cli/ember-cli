'use strict';

var attemptNeverIndex = require('../../../lib/utilities/attempt-never-index');
var quickTemp = require('quick-temp');
var isDarwin = (/darwin/i).test(require('os').type());

var chai = require('../../chai');
var expect = chai.expect;
var file = chai.file;

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
    expect(file(tmpPath + '/.metadata_never_index')).to.not.exist;

    attemptNeverIndex(tmpPath);

    if (isDarwin) {
      expect(file(tmpPath + '/.metadata_never_index')).to.exist;
    } else {
      expect(file(tmpPath + '/.metadata_never_index')).to.not.exist;
    }
  });
});
