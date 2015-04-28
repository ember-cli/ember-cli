'use strict';

var fs     = require('fs');
var path   = require('path');
var Writer = require('broccoli-caching-writer');

function ConfigLoader (inputTree, options) {
  if (!(this instanceof ConfigLoader)) {
    return new ConfigLoader(inputTree, options);
  }

  Writer.apply(this, arguments);

  this.options = options || {};
}

ConfigLoader.prototype = Object.create(Writer.prototype);
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

ConfigLoader.prototype.updateCache = function(srcDir, destDir) {
  var self = this;

  this.clearConfigGeneratorCache();

  var outputDir = path.join(destDir, 'environments');
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
