'use strict';

module.exports = function loadBrocfile() {
  var broccoli   = require('broccoli');
  var mergeTrees = require('broccoli-merge-trees');
  var exportTree = require('broccoli-export-tree');

  var tree           = broccoli.loadBrocfile();
  var liveOutputTree = exportTree(tree, {
    destDir: 'tmp/output'
  });

  return mergeTrees([tree, liveOutputTree]);
};
