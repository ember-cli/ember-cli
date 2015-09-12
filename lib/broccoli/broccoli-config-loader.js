'use strict';

var fs            = require('fs');
var path          = require('path');
var CachingWriter = require('broccoli-caching-writer');

function ConfigLoader (inputNode, options) {
  options = options || {};
  CachingWriter.call(this, [inputNode], { annotation: options.annotation });
  this.options = options;
}

ConfigLoader.prototype = Object.create(CachingWriter.prototype);
ConfigLoader.prototype.constructor = ConfigLoader;

/*
 * @private
 *
 * On windows, when residing on a UNC share (lib or app/addon code), exact
 * match here is not possible. Although we could be more precise, there is
 * little pain in evicting all fuzzy matches
 *
 * @method fuzzyPurgeRequireEntry
 */
function fuzzyPurgeRequireEntry(entry) {
 var matches = Object.keys(require.cache).filter(function(path) {
    return path.indexOf(entry) > -1;
  });

  matches.forEach(function(entry) {
    delete require.cache[entry];
  });
}

ConfigLoader.prototype.clearConfigGeneratorCache = function() {
  fuzzyPurgeRequireEntry(this.options.project.configPath() + '.js');
};

ConfigLoader.prototype.build = function() {
  var self = this;

  this.clearConfigGeneratorCache();

  var outputDir = path.join(this.outputPath, 'environments');
  fs.mkdirSync(outputDir);

  var environments = [this.options.env];
  if (this.options.tests) {
    environments.push('test');
  }

  environments.forEach(function(env) {
    var config = self.options.project.config(env);
    var jsonString = JSON.stringify(config);
    var outputPath = path.join(outputDir, env);

    fs.writeFileSync(outputPath + '.json', jsonString,   { encoding: 'utf8' });
  }, this);
};

module.exports = ConfigLoader;
