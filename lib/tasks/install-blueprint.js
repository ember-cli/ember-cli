'use strict';

var stringUtil = require('../utilities/string');
var path       = require('path');
var Task       = require('../task');
var chalk      = require('chalk');
var RSVP       = require('rsvp');
var Promise    = RSVP.Promise;
var walk       = require('walk-tree-as-promised');
var template   = require('lodash-node').template;
var readFile   = RSVP.denodeify(require('fs').readFile);
var writeFile  = RSVP.denodeify(require('fs-extra').outputFile);
var exists     = RSVP.denodeify(require('fs').exists);

module.exports = new Task({
  // Options: Boolean dryRun, String dir
  run: function(ui, options) {
    // Local variables for template
    var dirname = path.basename(process.cwd());
    var locals = {
      name:         stringUtil.dasherize(dirname),
      modulePrefix: stringUtil.dasherize(dirname),
      namespace:    stringUtil.classify(dirname)
    };

    function logVerbose(message) {
      if (options.verbose) { ui.write(message); }
    }

    function handleFile(filename) {
      var inputPath = path.join(options.blueprintDir, filename);
      filename = filename.replace(/gitignore$/, '.gitignore');
      var outputPath = path.join(process.cwd(), filename);

      return Promise.all([
          readFile(inputPath).then(render(locals)),
          readFile(outputPath).then(toString).catch(swallowNoEntryError)
        ])
        .then(function(r) {
          var processed = r[0];
          var existingOutput = r[1];
          var promise = Promise.resolve(true);

          if (existingOutput !== undefined) { // Alread exists?
            if (existingOutput === processed) {
              logVerbose('Existing file ' + chalk.green(filename) + ' is identical.\n');
              promise = Promise.resolve(false); // No need to write it again
            } else {
              // Ask the user if he/she wants to overwrite
              promise = ui.prompt({
                type: 'confirm',
                name: filename,
                message: 'Overwrite ' + chalk.green(filename) + '?'
              })
              .then(function(hash) { return hash[filename]; }); // Extract answer
            }
          }

          return promise
            .then(function(shouldWrite) {
              if (shouldWrite) {
                if (options.dryRun) {
                  logVerbose('Would create ' + chalk.green(filename) + '.\n');
                  return;
                }
                return writeFile(outputPath, processed)
                  .then(function() {
                    logVerbose('Created ' + chalk.green(filename) + '.\n');
                  });
              }
            });
        });
    }

    ui.pleasantProgress.start(chalk.green('Creating files'), chalk.green('.'));

    return walkFilesOnly(options.blueprintDir)
      .then(function(files) {
        return files.reduce(function(promise, file) { // Handle files sequentially
          return promise.then(function() { return handleFile(file); });
        }, Promise.resolve());
      })
      .finally(function() {
        ui.pleasantProgress.stop();
      })
      .then(function() {
        ui.write(chalk.green('Created files.\n'));
      });
  }
});

function walkFilesOnly(dir) {
  return walk(dir, {
    processDirectory: function(baseDir, relativePath, stat, entries, callback) {
      callback(null, Array.prototype.concat.apply([], entries));
    }
  });
}

function swallowNoEntryError(error) {
  if (error.code !== 'ENOENT') { throw error; }
}

function render(locals) {
  return function(content) { return template(content)(locals); }
}

function toString(buffer) { return buffer.toString(); }
