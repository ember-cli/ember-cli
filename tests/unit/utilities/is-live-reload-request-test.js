'use strict';

const expect = require('chai').expect;
const isLiveReloadRequest = require('../../../lib/utilities/is-live-reload-request');

describe('isLiveReloadRequest()', function() {
  it('/livereload', function() {
    expect(isLiveReloadRequest('/livereload', '/')).to.be.true;
  });
  it('path/livereload', function() {
    expect(isLiveReloadRequest('path/livereload', 'path/')).to.be.true;
  });
  it('path/path/livereload', function() {
    expect(isLiveReloadRequest('path/path/livereload', 'path/path/')).to.be.true;
  });
  it('livereload', function() {
    expect(isLiveReloadRequest('livereload', '/')).to.be.false;
  });
  it('livereload/path', function() {
    expect(isLiveReloadRequest('livereload/path', '/')).to.be.false;
  });
  it('/livereload.js', function() {
    expect(isLiveReloadRequest('/livereload.js', '/')).to.be.false;
  });
  it('path/livereload.js', function() {
    expect(isLiveReloadRequest('path/livereload.js', 'path/')).to.be.false;
  });
  it('path/livereload/path', function() {
    expect(isLiveReloadRequest('path/livereload/path', 'path/')).to.be.false;
  });
});
