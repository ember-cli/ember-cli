'use strict';

module.exports = function alphabetizeObjectKeys(unordered) {
  return Object.keys(unordered).sort().reduce(function(ordered, key) {
    ordered[key] = unordered[key];
    return ordered;
  }, {});
};
