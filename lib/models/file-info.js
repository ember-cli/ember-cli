'use strict';

var fs = require('fs');
var Promise = require('../ext/promise');
var readFile = Promise.denodeify(fs.readFile);
var lstat = Promise.denodeify(fs.stat);
var chalk = require('chalk');
var EditFileDiff = require('./edit-file-diff');
var EOL = require('os').EOL;
var isBinaryFile = require('isbinaryfile').sync;
var canEdit = require('../utilities/open-editor').canEdit;
var processTemplate = require('../utilities/process-template');

function diffHighlight(line) {
  if (line[0] === '+') {
    return chalk.green(line);
  } else if (line[0] === '-') {
    return chalk.red(line);
  } else if (line.match(/^@@/)) {
    return chalk.cyan(line);
  } else {
    return line;
  }
}

FileInfo.prototype.confirmOverwrite = function(path) {
  var promptOptions = {
    type: 'expand',
    name: 'answer',
    default: false,
    message: `${chalk.red('Overwrite')} ${path}?`,
    choices: [
      { key: 'y', name: 'Yes, overwrite', value: 'overwrite' },
      { key: 'n', name: 'No, skip', value: 'skip' },
    ],
  };

  var outputPathIsFile = false;
  try { outputPathIsFile = fs.statSync(this.outputPath).isFile(); } catch (err) { /* ignore */ }

  var canDiff = (
    !isBinaryFile(this.inputPath) && (
      !outputPathIsFile ||
      !isBinaryFile(this.outputPath)
    )
  );

  if (canDiff) {
    promptOptions.choices.push({ key: 'd', name: 'Diff', value: 'diff' });

    if (canEdit()) {
      promptOptions.choices.push({ key: 'e', name: 'Edit', value: 'edit' });
    }
  }

  return this.ui.prompt(promptOptions)
    .then(response => response.answer);
};

FileInfo.prototype.displayDiff = function() {
  var info = this,
      jsdiff = require('diff');
  return Promise.hash({
    input: this.render(),
    output: readFile(info.outputPath),
  }).then(result => {
    var diff = jsdiff.createPatch(
      info.outputPath, result.output.toString(), result.input
    );
    var lines = diff.split('\n');

    for (var i = 0; i < lines.length; i++) {
      info.ui.write(
        diffHighlight(lines[i] + EOL)
      );
    }
  });
};

function FileInfo(options) {
  this.action = options.action;
  this.outputBasePath = options.outputBasePath;
  this.outputPath = options.outputPath;
  this.displayPath = options.displayPath;
  this.inputPath = options.inputPath;
  this.templateVariables = options.templateVariables;
  this.ui = options.ui;
}

FileInfo.prototype.render = function() {
  var path = this.inputPath,
      context = this.templateVariables;
  if (!this.rendered) {
    this.rendered = readFile(path)
      .then(content => lstat(path)
        .then(fileStat => {
          if (isBinaryFile(content, fileStat.size)) {
            return content;
          } else {
            try {
              return processTemplate(content.toString(), context);
            } catch (err) {
              err.message += ` (Error in blueprint template: ${path})`;
              throw err;
            }
          }
        }));
  }
  return this.rendered;
};

FileInfo.prototype.checkForConflict = function() {
  return new Promise((resolve, reject) => {
    fs.exists(this.outputPath, (doesExist, error) => {
      if (error) {
        reject(error);
        return;
      }

      var result;

      if (doesExist) {
        result = Promise.hash({
          input: this.render(),
          output: readFile(this.outputPath),
        }).then(result => {
          var type;
          if (result.input.toString() === result.output.toString()) {
            type = 'identical';
          } else {
            type = 'confirm';
          }
          return type;
        });
      } else {
        result = 'none';
      }

      resolve(result);
    });
  });
};

FileInfo.prototype.confirmOverwriteTask = function() {
  var info = this;

  return function() {
    return new Promise((resolve, reject) => {
      function doConfirm() {
        info.confirmOverwrite(info.displayPath).then(action => {
          if (action === 'diff') {
            info.displayDiff().then(doConfirm, reject);
          } else if (action === 'edit') {
            var editFileDiff = new EditFileDiff({ info });
            editFileDiff.edit().then(() => {
              info.action = action;
              resolve(info);
            }).catch(() => {
              doConfirm().finally(() => {
                resolve(info);
              });
            });
          } else {
            info.action = action;
            resolve(info);
          }
        }, reject);
      }

      doConfirm();
    });
  }.bind(this);
};

module.exports = FileInfo;
