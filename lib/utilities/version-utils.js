'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  emberCLIVersion() {
    let gitPath = path.join(__dirname, '..', '..', '.git');
    let output = [require('../../package.json').version];

    if (fs.existsSync(gitPath)) {
      const getRepoInfo = require('git-repo-info');
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
};
