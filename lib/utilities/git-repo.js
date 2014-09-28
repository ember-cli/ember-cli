'use strict';

// Detect if the string refers to a remote git repo.
// Proably a bit janky, but borrowed from Bower,
// so it's at least a Known Trick.
module.exports = function(str){
  return (/^git(\+(ssh|https?))?:\/\//i).test(str) || (/\.git\/?$/i).test(str) || (/^git@/i).test(str);
};
