'use strict';

var fs = require('fs');
var path = require('path');
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
  fs.writeFileSync(path.join(dir, this.outputFile), this.content());
  return dir;
};

Reexporter.prototype.cleanup = function() {
  quickTemp.remove(this, 'tmpCacheDir');
};

module.exports = function(name, outputFile) {
  return new Reexporter(name, outputFile);
};
