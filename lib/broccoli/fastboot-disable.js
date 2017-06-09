'use strict';
const stew = require('broccoli-stew');

module.exports = function fastbootDisable(tree) {
  return stew.map(tree, (content) => `if (typeof FastBoot === 'undefined') { ${content} }`);
};
