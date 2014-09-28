'use strict';

var isGitRepo = require('../../../lib/utilities/git-repo');
var assert    = require('assert');

describe('cleanBaseURL()', function() {
  it('recognizes git-style urls in various formats', function() {
    assert.ok(isGitRepo('https://github.com/trek/app-blueprint-test.git'));
    assert.ok(isGitRepo('git@github.com:trek/app-blueprint-test.git'));
    assert.ok(isGitRepo('git+ssh://user@server/project.git'));
    assert.ok(isGitRepo('git+https://user@server/project.git'));
  });
});
