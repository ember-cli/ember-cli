'use strict';

module.exports = function isGitUrl(str) {
  let regex = /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|#[-\d\w._]+?)$/;
  return regex.test(str);
};
