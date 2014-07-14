'use strict';

var path = require('path');
var fs   = require('fs');

function <%= namespace %>(project) {
  this.project = project;
  this.name    = "<%= name %>";
}

function unwatchedTree(dir) {
  return {
    read:    function() { return dir; },
    cleanup: function() { }
  };
}

<%= namespace %>.prototype.treeFor = function treeFor(name) {
  var treePath =  path.join('node_modules', "<%= name %>", name);

  if (fs.existsSync(treePath)) {
    return unwatchedTree(treePath);
  }
};

<%= namespace %>.prototype.included = function included(app) {
  this.app = app;
  // this.app.import('vendor/<%= name %>/styles/style.css');
};

module.exports = <%= namespace %>;
