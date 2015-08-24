'use strict';

var fs         = require('fs-extra');
var existsSync = require('exists-sync');
var path       = require('path');
var Plugin     = require('broccoli-plugin');

function CustomReplace (inputNode, configNode, options) {
  options = options || {};
  Plugin.call(this, [inputNode, configNode], { annotation: options.annotation }); // this._super();

  this.options = options;
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
    var filePath = path.join(inputPath, file);
    var destPath = path.join(this.outputPath, file);

    this.processFile(config, filePath, destPath);
  }
};

CustomReplace.prototype.processFile = function(config, filePath, destPath) {
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

  if (!existsSync(path.dirname(destPath))) {
    fs.mkdirsSync(path.dirname(destPath));
  }
  fs.writeFileSync(destPath, contents, { encoding: 'utf8' });
};

CustomReplace.prototype.getConfig = function (srcDir) {
  var configPath = path.join(srcDir, this.options.configPath);

  return JSON.parse(fs.readFileSync(configPath, { encoding: 'utf8' }));
};

module.exports = CustomReplace;
