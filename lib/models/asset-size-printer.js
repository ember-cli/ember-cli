'use strict';

var chalk   = require('chalk');
var path    = require('path');
var Promise = require('../ext/promise');
var assign  = require('ember-cli-lodash-subset').assign;

function AssetPrinterSize(options) {
  assign(this, options);
}

AssetPrinterSize.prototype.print = function () {
  var filesize = require('filesize');
  var ui = this.ui;

  return this.makeAssetSizesObject().then(function (files) {
    this.validateAssetPath(files);

    ui.writeLine(chalk.green('File sizes:'));
    return files.forEach(function (file) {
      var sizeOutput = filesize(file.size);
      if (file.showGzipped) {
        sizeOutput += ' (' + filesize(file.gzipSize) + ' gzipped)';
      }

      ui.writeLine(chalk.blue(' - ' + file.name + ': ') + chalk.white(sizeOutput));
    });

  }.bind(this));
};

AssetPrinterSize.prototype.printJSON = function () {
  var ui = this.ui;
  return this.makeAssetSizesObject().then(function (files) {
    this.validateAssetPath(files);

    ui.writeLine(JSON.stringify({files: files}));
  }.bind(this));
};

AssetPrinterSize.prototype.makeAssetSizesObject = function () {
  var fs = require('fs');
  var zlib = require('zlib');
  var gzip = Promise.denodeify(zlib.gzip);
  var files = this.makeFileGlob();
  var testFileRegex = /(test-(loader|support))|(testem)/i;

  var assets = files
    // Skip test files
    .filter(function (file) {
      var filename = path.basename(file);
      return !testFileRegex.test(filename);
    })
    // Print human-readable file sizes (including gzipped)
    .map(function (file) {
      var contentsBuffer = fs.readFileSync(file);
      return gzip(contentsBuffer).then(function (buffer) {
        return {
          name: file,
          size: contentsBuffer.length,
          gzipSize: buffer.length,
          showGzipped: contentsBuffer.length > 0
        };
      });
    });

  return Promise.all(assets);
};

AssetPrinterSize.prototype.makeFileGlob = function () {
  var glob = require('glob');
  var outputPath = this.outputPath;
  var globOptions = {nodir: true};

  return glob.sync(outputPath + '/**/*.{css,js}', globOptions);
};

AssetPrinterSize.prototype.validateAssetPath = function (files) {
  if (!files.length) {
    throw new Error('No asset files found in the path provided: ' + this.outputPath);
  }
};

module.exports = AssetPrinterSize;
