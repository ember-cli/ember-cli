'use strict';

var fs           = require('fs');
var _            = require('lodash-node');
var Promise      = require('../ext/promise');
var readFile     = Promise.denodeify(fs.readFile);
var chalk        = require('chalk');
var EditFileDiff = require('./edit-file-diff');

function processTemplate(content, context) {
  return _.template(content)(context);
}

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
    message: chalk.red('Overwrite') + ' ' + path + '?',
    choices: [
      { key: 'y', name: 'Yes, overwrite', value: 'overwrite' },
      { key: 'n', name: 'No, skip', value: 'skip' },
      { key: 'd', name: 'Diff', value: 'diff' }
    ]
  };

  if(canEdit()) {
    promptOptions.choices.push({ key: 'e', name: 'Edit', value: 'edit' });
  }

  return this.ui.prompt(promptOptions)
    .then(function(response) {
      return response.answer;
    });
};

function canEdit() {
  return ! /^win/.test(process.platform) && process.env.EDITOR !== undefined;
}

FileInfo.prototype.displayDiff = function() {
  var info = this,
      jsdiff = require('diff');
  return Promise.hash({
    input: this.render(),
    output: readFile(info.outputPath)
  }).then(function(result) {
    var diff = jsdiff.createPatch(
      info.outputPath, result.output.toString(), result.input
    );
    var lines = diff.split('\n');

    for (var i=0;i<lines.length;i++) {
      info.ui.write(
        diffHighlight(lines[i]+'\n')
      );
    }
  });
};

function FileInfo(options) {
  this.action = options.action;
  this.outputPath = options.outputPath;
  this.displayPath = options.displayPath;
  this.inputPath =  options.inputPath;
  this.templateVariables = options.templateVariables;
  this.ui = options.ui;
}

FileInfo.prototype.render = function() {
  var path = this.inputPath,
      context = this.templateVariables;
  if (!this.rendered) {
    this.rendered = readFile(path).then(function(content){
      try {
        return processTemplate(content.toString(), context);
      } catch (error) {
        return content;
      }
    });
  }
  return this.rendered;
};

FileInfo.prototype.checkForConflict = function() {
  return new Promise(function (resolve, reject) {
    fs.exists(this.outputPath, function (doesExist, error) {
      if (error) {
        reject(error);
        return;
      }

      var result;

      if (doesExist) {
        result = Promise.hash({
          input: this.render(),
          output: readFile(this.outputPath)
        }).then(function(result) {
          var type;
          if (result.input === result.output.toString()) {
            type = 'identical';
          } else {
            type = 'confirm';
          }
          return type;
        }.bind(this));
      } else {
        result = 'none';
      }

      resolve(result);
    }.bind(this));
  }.bind(this));
};

FileInfo.prototype.confirmOverwriteTask = function() {
  var info = this;

  return function() {
    return new Promise(function(resolve, reject){
      function doConfirm(){
        info.confirmOverwrite(info.outputPath).then(function(action){
          if (action === 'diff') {
            info.displayDiff().then(doConfirm, reject);
          } else if (action === 'edit') {
            var editFileDiff = new EditFileDiff({info: info});
            editFileDiff.edit().then(function() {
              info.action = action;
              resolve(info);
            }).catch(function() {
              doConfirm()
                .finally(function() {
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
