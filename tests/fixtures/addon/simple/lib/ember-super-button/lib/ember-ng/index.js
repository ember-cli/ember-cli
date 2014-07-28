'use strict';

var path = require('path');
var fs   = require('fs');

function EmberNg(project) {
  this.project = project;
  this.name = 'Ember Ng';
}

function unwatchedTree(dir){
  return {read: function() { return dir; }};
}

EmberNg.prototype.treeFor = function treeFor(name) {
  var treePath = path.join(__dirname, name);

  if (fs.existsSync(treePath)) {
    return unwatchedTree(treePath);
  }
};

EmberNg.prototype.included = function included(app) {
  this.app = app;
};

module.exports = EmberNg;
