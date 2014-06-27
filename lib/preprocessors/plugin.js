'use strict';

var path         = require('path');
var fs           = require('fs');
var detect       = require('lodash-node/modern/collections/find');

function Plugin(name, ext, options) {
  this.name = name;
  this.ext = ext;
  this.options = options || {};
  this.registry = this.options.registry;
  this.applicationName = this.options.applicationName;

  if (this.options.toTree) {
    this.toTree = this.options.toTree;
  }
}

Plugin.prototype.toTree = function() {
  throw new Error('A Plugin must implement the `toTree` method.');
};

Plugin.prototype.getExt = function(inputPath, filename) {
  if(Array.isArray(this.ext)) {
    return detect(this.ext, function(ext) {
      var filenameAndExt = filename + '.' + ext;
      return fs.existsSync(path.join('.', inputPath, filenameAndExt));
    });
  } else {
    return this.ext;
  }
};

module.exports = Plugin;
