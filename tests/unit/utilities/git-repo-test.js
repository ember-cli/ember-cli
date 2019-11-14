'use strict';

const isGitRepo = require('is-git-url');
const expect = require('chai').expect;

describe('is-git-url', function() {
  it('recognizes git-style urls in various formats', function() {
    // without ref
    expect(isGitRepo('https://github.com/trek/app-blueprint-test.git')).to.be.ok;
    expect(isGitRepo('git@github.com:trek/app-blueprint-test.git')).to.be.ok;
    expect(isGitRepo('git+ssh://user@server/project.git')).to.be.ok;
    expect(isGitRepo('git+https://user@server/project.git')).to.be.ok;

    // with ref
    expect(isGitRepo('https://github.com/trek/app-blueprint-test.git#named-ref')).to.be.ok;
    expect(isGitRepo('git@github.com:trek/app-blueprint-test.git#named-ref')).to.be.ok;
    expect(isGitRepo('git+ssh://user@server/project.git#named-ref')).to.be.ok;
    expect(isGitRepo('git+https://user@server/project.git#named-ref')).to.be.ok;
  });
});
