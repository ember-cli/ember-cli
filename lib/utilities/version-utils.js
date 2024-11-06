'use strict';

const fs = require('fs');
const path = require('path');
const getRepoInfo = require('git-repo-info');
const semver = require('semver');
const emberCLIVersion = require('../../package').version

module.exports = {
  emberCLIVersion() {
    let gitPath = path.join(__dirname, '..', '..', '.git');
    let output = [require('../../package.json').version];

    if (fs.existsSync(gitPath)) {
      let { branch, abbreviatedSha } = getRepoInfo(gitPath);

      if (branch) {
        output.push(branch.replace(/\//g, '-'));
      }
      output.push(abbreviatedSha);
    }

    return output.join('-');
  },

  isDevelopment(version) {
    // match postfix SHA in dev version
    return /\b[0-9a-f]{5,40}\b/.test(version);
  },

  isDeprecationRemoved(until) {
    const currentEmberCLIVersion = process.env.OVERRIDE_DEPRECATION_VERSION ?? emberCLIVersion;
    const isDeprecationRemoved = semver.gte(currentEmberCLIVersion, until);
    return isDeprecationRemoved;
  },
};
