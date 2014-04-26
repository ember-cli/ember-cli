'use strict';

var fs = require('fs');
var _ = require('lodash-node');
var Promise = require('../ext/promise');
var readFile = Promise.denodeify(fs.readFile);
var chalk = require('chalk');

function processTemplate(content, context) {
  return _.template(content)(context);
}

FileInfo.prototype.confirmOverwrite = function(path) {
  var promptOptions = {
    type: 'confirm',
    name: 'answer',
    default: false,
    message: chalk.red('Overwrite') + ' ' + path + '?'
  };

  return this.ui.prompt(promptOptions)
    .then(function(response) {
      if (response.answer) {
        return 'overwrite';
      } else {
        return 'skip';
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
      return processTemplate(content.toString(), context);
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
    return this.confirmOverwrite(info.outputPath).then(function(action) {
      info.action = action;
      return info;
    });
  }.bind(this);
};

module.exports = FileInfo;
