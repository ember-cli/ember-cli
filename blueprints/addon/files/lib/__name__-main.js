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

  if (name === 'templates' || name === 'styles') {
    var treePath =  path.join('node_modules', "ember-token-auth", 'app', name);
  } else {
    var treePath =  path.join('node_modules', "ember-token-auth", name);
  }

  if (fs.existsSync(treePath)) {
    return unwatchedTree(treePath);
  }
};

<%= namespace %>.prototype.included = function included(app) {
  this.app = app;
  // this.app.import('vendor/<%= name %>/styles/style.css');
};

module.exports = <%= namespace %>;
