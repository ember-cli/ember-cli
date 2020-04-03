'use strict';

const expect = require('chai').expect;
const td = require('testdouble');
const versionUtils = require('../../../lib/utilities/version-utils');

describe('version-utils', function () {
  it('`isDevelopment` returns false if a release version was passed in', function () {
    expect(versionUtils.isDevelopment('0.0.5')).to.equal(false);
  });

  it('`isDevelopment` returns true if a development version was passed in', function () {
    expect(versionUtils.isDevelopment('0.0.5-master-237cc6024d')).to.equal(true);
  });

  describe('emberCLIVersion', function () {
    let gitRepoInfo;

    beforeEach(function () {
      gitRepoInfo = td.replace('git-repo-info');
      td.replace('../../../package.json', { version: '1.0.0' });
    });

    afterEach(function () {
      td.reset();
    });

    it('handles git branches with slashes in the name', function () {
      td.when(gitRepoInfo(td.matchers.anything())).thenReturn({
        branch: 'my/slashed/name',
        abbreviatedSha: 'abbvSha',
      });

      let version = versionUtils.emberCLIVersion();
      expect(version).to.equal('1.0.0-my-slashed-name-abbvSha');
    });
  });
});
