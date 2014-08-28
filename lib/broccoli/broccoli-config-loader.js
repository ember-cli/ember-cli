'use strict';

var fs     = require('fs');
var path   = require('path');
var Filter = require('broccoli-filter');

function ConfigLoader (inputTree, options) {
  if (!(this instanceof ConfigLoader)) {
    return new ConfigLoader(inputTree, options);
  }

  this.inputTree = inputTree;
  this.options = options || {};
}

ConfigLoader.prototype = Object.create(Filter.prototype);
ConfigLoader.prototype.constructor = ConfigLoader;

ConfigLoader.prototype.extensions = ['js'];
ConfigLoader.prototype.targetExtension = 'js';

ConfigLoader.prototype.processFile = function (srcDir, destDir, relativePath) {
  var outputPath = path.join(destDir, relativePath);
  var configPath = path.join(this.options.project.root, srcDir, relativePath);

  // clear the previously cached version of this module
  delete require.cache[configPath];

  var configGenerator = require(configPath);
  var currentConfig = configGenerator(this.options.env);

  var moduleString = 'export default ' + JSON.stringify(currentConfig) + ';';

  fs.writeFileSync(outputPath, moduleString, { encoding: 'utf8' });
};

module.exports = ConfigLoader;
