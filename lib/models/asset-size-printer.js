'use strict';

var chalk   = require('chalk');
var Task    = require('../models/task');
var path    = require('path');
var Promise = require('../ext/promise');

module.exports = Task.extend({
  print: function () {
    var ui = this.ui;

    return Promise.resolve()
      .then(function () {
        var filesize = require('filesize');
        var fs = require('fs');
        var zlib = require('zlib');
        var gzip = Promise.denodeify(zlib.gzip);
        var files = this.makeFileGlob();
        var testFileRegex = /(test-(loader|support))|(testem)/i;
        var promises = [];

        this.validateAssetPath(files);
        ui.writeLine(chalk.green('File sizes:'));

        files
          // Skip test files
          .filter(function (file) {
            var filename = path.basename(file);
            return !testFileRegex.test(filename);
          })
          // Print human-readable file sizes (including gzipped)
          .forEach(function (file) {
            var filename = path.basename(file);
            var contentsBuffer = fs.readFileSync(file);
            var gzipPromise = gzip(contentsBuffer).then(function (buffer) {
              return {
                name: filename,
                size: filesize(contentsBuffer.length),
                gzipSize: filesize(buffer.length),
                showGzipped: contentsBuffer.length > 0
              };
            });

            promises.push(gzipPromise);
          });

        return Promise.all(promises);
      }.bind(this))
      .then(function (files) {
        files.forEach(function (file) {
          var sizeOutput = file.size;
          if (file.showGzipped) {
            sizeOutput += ' (' + file.gzipSize + ' gzipped)';
          }

          ui.writeLine(chalk.blue(' - ' + file.name + ': ') + chalk.white(sizeOutput));
        });
      });
  },

  makeFileGlob: function () {
    var glob = require('glob');
    var outputPath = this.outputPath;
    var globOptions = {nodir: true};

    return glob.sync(outputPath + '/**/*.{css,js}', globOptions);
  },

  validateAssetPath: function (files) {
    if (!files.length) {
      throw new Error('No asset files found in the path provided: ' + this.outputPath);
    }
  }
});
