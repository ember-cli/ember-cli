'use strict';

var fs       = require('fs');
var path     = require('path');
var getRepoInfo = require('git-repo-info');

module.exports = function () {
  var gitPath = path.join(__dirname, '..','..','.git');
  var output  = [require('../../package.json').version];

  if (fs.existsSync(gitPath)) {
    var repoInfo = getRepoInfo(gitPath);

    output.push(repoInfo.branch);
    output.push(repoInfo.abbreviatedSha);
  }

  return output.join('-');
};
