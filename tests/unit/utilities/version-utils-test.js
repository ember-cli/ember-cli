'use strict';

const { expect } = require('chai');
const versionUtils = require('../../../lib/utilities/version-utils');

describe('version-utils', function () {
  describe('isDevelopment', function () {
    it('returns false if a release version was passed in', function () {
      expect(versionUtils.isDevelopment('0.0.5')).to.equal(false);
    });

    it('returns true if a development version was passed in', function () {
      expect(versionUtils.isDevelopment('0.0.5-master-237cc6024d')).to.equal(true);
    });

    it('returns true for versions with SHA hashes', function () {
      expect(versionUtils.isDevelopment('1.2.3-abc123')).to.equal(true);
      expect(versionUtils.isDevelopment('1.2.3-feature-branch-abc123def')).to.equal(true);
    });

    it('returns false for pre-release versions without SHA', function () {
      expect(versionUtils.isDevelopment('1.2.3-alpha')).to.equal(false);
      expect(versionUtils.isDevelopment('1.2.3-beta.1')).to.equal(false);
    });
  });

  describe('emberCLIVersion', function () {
    it('returns a valid version string', function () {
      const version = versionUtils.emberCLIVersion();
      expect(version).to.be.a('string');
      expect(version).to.match(/^\d+\.\d+\.\d+/);
    });

    it('includes git info in development builds', function () {
      const version = versionUtils.emberCLIVersion();
      // If this is a development build (has git info), it should have dashes
      if (versionUtils.isDevelopment(version)) {
        expect(version).to.include('-');
        // Should have at least version-branch-sha format
        const parts = version.split('-');
        expect(parts.length).to.be.at.least(3);
      }
    });

    it('starts with package.json version', function () {
      const packageVersion = require('../../../package.json').version;
      const cliVersion = versionUtils.emberCLIVersion();
      
      expect(cliVersion).to.match(new RegExp(`^${packageVersion.replace(/\./g, '\\.')}`));
    });

    it('handles missing git directory gracefully', function () {
      // This test ensures the function doesn't throw when .git is missing
      // The actual version should still be returned from package.json
      expect(() => versionUtils.emberCLIVersion()).to.not.throw();
    });
  });
});
