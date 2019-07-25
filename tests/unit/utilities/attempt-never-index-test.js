'use strict';

const attemptNeverIndex = require('../../../lib/utilities/attempt-never-index');
const quickTemp = require('quick-temp');
let isDarwin = /darwin/i.test(require('os').type());

const chai = require('../../chai');
let expect = chai.expect;
let file = chai.file;

describe('attempt-never-index', function() {
  let context = {};
  let tmpPath;
  before(function() {
    tmpPath = quickTemp.makeOrRemake(context, 'attempt-never-index');
  });

  after(function() {
    quickTemp.remove(context, 'attempt-never-index');
  });

  it('sets the hint to spotlight if possible', function() {
    expect(file(`${tmpPath}/.metadata_never_index`)).to.not.exist;

    attemptNeverIndex(tmpPath);

    if (isDarwin) {
      expect(file(`${tmpPath}/.metadata_never_index`)).to.exist;
    } else {
      expect(file(`${tmpPath}/.metadata_never_index`)).to.not.exist;
    }
  });
});
