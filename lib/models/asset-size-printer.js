'use strict';

const chalk = require('chalk');
const path = require('path');
const RSVP = require('rsvp');

class AssetPrinterSize {
  constructor(options) {
    Object.assign(this, options);
  }

  print() {
    const filesize = require('filesize');
    let ui = this.ui;

    return this.makeAssetSizesObject().then(files => {
      if (files.length !== 0) {
        ui.writeLine(chalk.green('File sizes:'));
        return files.forEach(file => {
          let sizeOutput = filesize(file.size);
          if (file.showGzipped) {
            sizeOutput += ` (${filesize(file.gzipSize)} gzipped)`;
          }

          ui.writeLine(chalk.blue(` - ${file.name}: `) + sizeOutput);
        });
      } else {
        ui.writeLine(chalk.red(`No asset files found in the path provided: ${this.outputPath}`));
      }

    });
  }

  printJSON() {
    let ui = this.ui;
    return this.makeAssetSizesObject().then(files => {
      if (files.length !== 0) {
        let entries = files.map(file => ({
          name: file.name,
          size: file.size,
          gzipSize: file.gzipSize,
        }));
        ui.writeLine(JSON.stringify({ files: entries }));
      } else {
        ui.writeLine(chalk.red(`No asset files found in the path provided: ${this.outputPath}`));
      }
    });
  }

  makeAssetSizesObject() {
    const fs = require('fs');
    const zlib = require('zlib');
    let gzip = RSVP.denodeify(zlib.gzip);
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

    return RSVP.all(assets);
  }

  makeFileGlob() {
    const glob = require('glob');
    let outputPath = this.outputPath;
    let globOptions = { nodir: true };

    return glob.sync(`${outputPath}/**/*.{css,js}`, globOptions);
  }
}

module.exports = AssetPrinterSize;
