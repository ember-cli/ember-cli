'use strict';

module.exports = function loadBrocfile(liveOutputDir) {
  var broccoli   = require('broccoli');
  var mergeTrees = require('broccoli-merge-trees');
  var exportTree = require('broccoli-export-tree');

  var tree           = broccoli.loadBrocfile();
  var liveOutputTree = exportTree(tree, {
    destDir: liveOutputDir || 'tmp/output'
  });

  return mergeTrees([
    tree,
    liveOutputTree
  ], 'Brocfile');
};
