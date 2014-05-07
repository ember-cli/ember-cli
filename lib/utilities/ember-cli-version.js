'use strict';

var fs   = require('fs');
var path = require('path');

module.exports = function () {
  var output         = [require('../../package.json').version];
  var gitPath        = path.join(__dirname, '..','..','.git');
  var headFilePath   = path.join(gitPath, 'HEAD');

  try {
    if (fs.existsSync(headFilePath)) {
      var branchSHA;
      var headFile = fs.readFileSync(headFilePath, {encoding: 'utf8'});
      var branchName = headFile.split('/').slice(-1)[0].trim();
      var refPath = headFile.split(' ')[1];

      if (refPath) {
        var branchPath = path.join(gitPath, refPath.trim());
        branchSHA  = fs.readFileSync(branchPath);
      } else {
        branchSHA = branchName;
      }

      output.push(branchName);

      output.push(branchSHA.slice(0,10));
    }
  } catch (err) {
    console.error(err.stack);
  }

  return output.join('-');
};
