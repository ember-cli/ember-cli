'use strict';

module.exports = function getBuilder(broccoli, appRoot) {
  var brocfile = require('../../../Brocfile');

  process.chdir(appRoot);

  var tree = brocfile(broccoli);

  if(Array.isArray(tree)) {
    tree = new broccoli.MergedTree(tree);
  }

  return new broccoli.Builder(tree);
};
