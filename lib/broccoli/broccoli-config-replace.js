'use strict';

var fs         = require('fs-extra');
var existsSync = require('exists-sync');
var path       = require('path');
var Plugin     = require('broccoli-plugin');
var helpers    = require('broccoli-kitchen-sink-helpers');

function CustomReplace (inputNode, configNode, options) {
  options = options || {};
  Plugin.call(this, [inputNode, configNode], { annotation: options.annotation }); // this._super();

  this.options = options;
  this._cache = {};
}
CustomReplace.prototype = Object.create(Plugin.prototype);
CustomReplace.prototype.constructor = CustomReplace;

CustomReplace.prototype.build = function () {
  var inputPath = this.inputPaths[0];
  var configPath = this.inputPaths[1];
  var files = this.options.files;
  var config = this.getConfig(configPath);

  for (var i = 0, l = files.length; i < l; i++) {
    var file = files[i];
    var key = this.deriveCacheKey(configPath, file);
    var filePath, destPath;
    var entry = this._cache[key.hash];

    if (entry) {
      this.writeFile(path.join(this.outputPath, entry.file), entry.contents);
    } else {
      filePath = path.join(inputPath, file);
      destPath = path.join(this.outputPath, file);

      this.processFile(config, filePath, destPath, key);
    }
  }

};

CustomReplace.prototype.deriveCacheKey = function(srcDir, file) {
  var configPath = path.join(srcDir, this.options.configPath);
  var stats = fs.statSync(configPath);

  if (stats.isDirectory()) {
    throw new Error('Must provide a path for the config file, you supplied a directory');
  }

  var patterns = this.options.patterns.reduce(function(a, b) {
    return a.match + b;
  }, '');

  return {
    file: file,
    hash: helpers.hashStrings([
      file,
      configPath,
      patterns,
      stats.size,
      stats.mode,
      stats.mtime.getTime()
    ])
  };
};

CustomReplace.prototype.processFile = function(config, filePath, destPath, key) {
  var contents = fs.readFileSync(filePath, { encoding: 'utf8' });
  for (var i = 0, l = this.options.patterns.length; i < l; i++) {
    // jshint loopfunc:true
    var pattern = this.options.patterns[i];
    var replacement = pattern.replacement;

    if (typeof pattern.replacement === 'function') {
      replacement = function() {
        var args = Array.prototype.slice.call(arguments);

        return pattern.replacement.apply(null, [config].concat(args));
      };
    }

    contents = contents.replace(pattern.match, replacement);
  }

  this.pruneCache(key.file);
  this._cache[key.hash] = { file: key.file, contents: contents };
  this.writeFile(destPath, contents);
};

CustomReplace.prototype.writeFile = function(destPath, contents) {
  if (!existsSync(path.dirname(destPath))) {
    fs.mkdirsSync(path.dirname(destPath));
  }
  fs.writeFileSync(destPath, contents, { encoding: 'utf8' });
};

CustomReplace.prototype.pruneCache = function(fileName) {
  var cache = {};

  Object.keys(this._cache).forEach(function(hash) {
    if (this._cache[hash].file !== fileName) {
      cache[hash] = this._cache[hash];
    }
  }, this);

  this._cache = cache;
};

CustomReplace.prototype.getConfig = function (srcDir) {
  var configPath = path.join(srcDir, this.options.configPath);

  return JSON.parse(fs.readFileSync(configPath, { encoding: 'utf8' }));
};

module.exports = CustomReplace;
