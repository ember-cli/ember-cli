'use strict';

const isGitRepo = require('is-git-url');
const { expect } = require('chai');

describe('is-git-url', function() {
  it('recognizes git-style urls in various formats', function() {
    expect(isGitRepo('https://github.com/trek/app-blueprint-test.git')).to.be.ok;
    expect(isGitRepo('git@github.com:trek/app-blueprint-test.git')).to.be.ok;
    expect(isGitRepo('git+ssh://user@server/project.git')).to.be.ok;
    expect(isGitRepo('git+https://user@server/project.git')).to.be.ok;
  });
});
