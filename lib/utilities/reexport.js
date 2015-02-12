'use strict';

var fs = require('fs-extra');
var path = require('path');
var Promise = require('../ext/promise');
var rimraf = Promise.denodeify(fs.remove);
var template = fs.readFileSync(path.join(__dirname, 'reexport-template.js'), 'utf-8');
var quickTemp = require('quick-temp');

function Reexporter(name, outputFile) {
  this.name = name;
  this.outputFile = outputFile;
}

Reexporter.prototype.content = function() {
  return template
    .replace(/\s*\/\*.*\*\/\s*/, '')
    .replace('{{DEST}}', this.name)
    .replace('{{SRC}}', this.name + '/index');
};

Reexporter.prototype.read = function() {
  var dir = quickTemp.makeOrReuse(this, 'tmpCacheDir');

  if (!this.subdirCreated) {
    fs.mkdirSync(path.join(dir, 'reexports'));
    this.subdirCreated = true;
  }

  fs.writeFileSync(path.join(dir, 'reexports', this.outputFile), this.content());

  return dir;
};

Reexporter.prototype.cleanup = function() {
  return rimraf(this['tmpCacheDir']);
};

module.exports = function(name, outputFile) {
  return new Reexporter(name, outputFile);
};
