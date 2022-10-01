'use strict';

const chalk = require('chalk');
const path = require('path');
const walkSync = require('walk-sync');
const workerpool = require('workerpool');

module.exports = class AssetPrinterSize {
  constructor(options) {
    Object.assign(this, options);
  }

  print() {
    const { filesize } = require('filesize');
    let ui = this.ui;

    return this.makeAssetSizesObject().then((files) => {
      if (files.length !== 0) {
        ui.writeLine(chalk.green('File sizes:'));
        return files.forEach((file) => {
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
    return this.makeAssetSizesObject().then((files) => {
      if (files.length !== 0) {
        let entries = files.map((file) => ({
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

  async makeAssetSizesObject() {
    let files = this.findFiles();
    let testFileRegex = /(test-(loader|support))|(testem)/i;

    // create a dedicated worker
    const pool = workerpool.pool(`${__dirname}/worker.js`);

    try {
      let assets = files
        // Skip test files
        .filter((file) => {
          let filename = path.basename(file);
          return !testFileRegex.test(filename);
        })
        // Print human-readable file sizes (including gzipped)
        .map((file) => {
          return pool.exec('gzipStats', [file]);
        });

      return await Promise.all(assets);
    } finally {
      pool.terminate(); // terminate all workers when done
    }
  }

  findFiles() {
    let outputPath = this.outputPath;

    try {
      return walkSync(outputPath, {
        directories: false,
      })
        .filter((x) => x.endsWith('.css') || x.endsWith('.js'))
        .map((x) => path.join(outputPath, x));
    } catch (e) {
      if (e !== null && typeof e === 'object' && e.code === 'ENOENT') {
        throw new Error(`No asset files found in the path provided: ${outputPath}`);
      } else {
        throw e;
      }
    }
  }
};
