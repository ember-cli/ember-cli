'use strict';

var path = require('path');
var fs   = require('fs');

function EmberSuperButton(project) {
  this.project = project;
  this.name = 'Ember Super Button';
}

function unwatchedTree(dir){
  return {read: function() { return dir; }};
}

EmberSuperButton.prototype.treeFor = function treeFor(name) {
  var treePath = path.join(__dirname, name);

  if (fs.existsSync(treePath)) {
    return unwatchedTree(treePath);
  }
};

EmberSuperButton.prototype.included = function included(app) {
  this.app = app;
};

module.exports = EmberSuperButton;
