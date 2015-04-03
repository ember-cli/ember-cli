'use strict';

// Detect if the string refers to a remote git repo.
// Only handles git://, ssh://, and https://
module.exports = function(str){
  return (/^((git|ssh|https?))?:\/\//i).test(str) || (/\.git\/?$/i).test(str) || (/^git@/i).test(str);
};
