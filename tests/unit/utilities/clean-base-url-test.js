'use strict';

var cleanBaseURL = require('../../../lib/utilities/clean-base-url');
var expect       = require('chai').expect;

describe('cleanBaseURL()', function() {
  it('should transfrom baseURL correctly', function() {
    expect(cleanBaseURL('')).to.equal('/');
    expect(cleanBaseURL('/')).to.equal('/');
    expect(cleanBaseURL('ember')).to.equal('/ember/');
    expect(cleanBaseURL('/ember')).to.equal('/ember/');
    expect(cleanBaseURL('ember/')).to.equal('/ember/');
    expect(cleanBaseURL('/ember/')).to.equal('/ember/');
    expect(cleanBaseURL('ember/hamsters')).to.equal('/ember/hamsters/');
    expect(cleanBaseURL('/ember/hamsters/')).to.equal('/ember/hamsters/');
    expect(cleanBaseURL('app://localhost')).to.equal('app://localhost/');
    expect(cleanBaseURL('app://localhost/')).to.equal('app://localhost/');
  });
});
