'use strict';

var fs = require('fs-extra');
var path = require('path');
var Promise = require('../ext/promise');
var rimraf = Promise.denodeify(fs.remove);
var template = fs.readFileSync(path.join(__dirname, 'reexport-template.js'), 'utf-8');
var quickTemp = require('quick-temp');
var hashStrings = require('broccoli-kitchen-sink-helpers').hashStrings;

function Reexporter(name, outputFile) {
  this.name = name;
  this.outputFile = outputFile;
  this.lastHash = undefined;
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

  var outputPath = path.join(dir, 'reexports', this.outputFile);

  var content = this.content();
  var hash = hashStrings([content]);

  if (this.lastHash !== hash) {
    this.lastHash = hash;
    fs.writeFileSync(outputPath, content);
  }

  return dir;
};

Reexporter.prototype.cleanup = function() {
  return rimraf(this['tmpCacheDir']);
};

module.exports = function(name, outputFile) {
  return new Reexporter(name, outputFile);
};
