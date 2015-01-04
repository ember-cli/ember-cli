'use strict';

var isGitRepo = require('../../../lib/utilities/git-repo');
var expect    = require('chai').expect ;

describe('cleanBaseURL()', function() {
  it('recognizes git-style urls in various formats', function() {
    expect(isGitRepo('https://github.com/trek/app-blueprint-test.git')).to.equal(true);
    expect(isGitRepo('git@github.com:trek/app-blueprint-test.git')).to.equal(true);
    expect(isGitRepo('git+ssh://user@server/project.git')).to.equal(true);
    expect(isGitRepo('git+https://user@server/project.git')).to.equal(true);
  });
});
