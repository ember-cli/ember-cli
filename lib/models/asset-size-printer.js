'use strict';

let chalk = require('chalk');
let path = require('path');
let Promise = require('../ext/promise');
let assign = require('ember-cli-lodash-subset').assign;

function AssetPrinterSize(options) {
  assign(this, options);
}

AssetPrinterSize.prototype.print = function() {
  let filesize = require('filesize');
  let ui = this.ui;

  return this.makeAssetSizesObject().then(files => {
    if (files.length !== 0) {
      ui.writeLine(chalk.green('File sizes:'));
      return files.forEach(file => {
        let sizeOutput = filesize(file.size);
        if (file.showGzipped) {
          sizeOutput += ` (${filesize(file.gzipSize)} gzipped)`;
        }

        ui.writeLine(chalk.blue(` - ${file.name}: `) + chalk.white(sizeOutput));
      });
    } else {
      ui.writeLine(chalk.red(`No asset files found in the path provided: ${this.outputPath}`));
    }

  });
};

AssetPrinterSize.prototype.printJSON = function() {
  let ui = this.ui;
  return this.makeAssetSizesObject().then(files => {
    if (files.length !== 0) {
      ui.writeLine(JSON.stringify({ files }));
    } else {
      ui.writeLine(chalk.red(`No asset files found in the path provided: ${this.outputPath}`));
    }
  });
};

AssetPrinterSize.prototype.makeAssetSizesObject = function() {
  let fs = require('fs');
  let zlib = require('zlib');
  let gzip = Promise.denodeify(zlib.gzip);
  let files = this.makeFileGlob();
  let testFileRegex = /(test-(loader|support))|(testem)/i;

  let assets = files
    // Skip test files
    .filter(file => {
      let filename = path.basename(file);
      return !testFileRegex.test(filename);
    })
    // Print human-readable file sizes (including gzipped)
    .map(file => {
      let contentsBuffer = fs.readFileSync(file);
      return gzip(contentsBuffer).then(buffer => ({
        name: file,
        size: contentsBuffer.length,
        gzipSize: buffer.length,
        showGzipped: contentsBuffer.length > 0,
      }));
    });

  return Promise.all(assets);
};

AssetPrinterSize.prototype.makeFileGlob = function() {
  let glob = require('glob');
  let outputPath = this.outputPath;
  let globOptions = { nodir: true };

  return glob.sync(`${outputPath}/**/*.{css,js}`, globOptions);
};

module.exports = AssetPrinterSize;
