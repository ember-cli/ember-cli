var fs = require('fs'),
  _ = require('lodash-node'),
  RSVP = require('rsvp'),
  Promise = RSVP.Promise,
  readFile = RSVP.denodeify(fs.readFile),
  chalk = require('chalk'),
  confirm = require('../ui/confirm');

function FileInfo(options) {
  this.action = options.action;
  this.shouldConfirm = options.shouldConfirm;
  this.outputPath = options.outputPath;
  this.displayPath = options.displayPath;
  this.inputPath =  options.inputPath;
  this.namespace = options.namespace;
}

FileInfo.prototype.render = function() {
  if (!this.rendered) {
    this.rendered = processTemplate(this.inputPath, {namespace: this.namespace});
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
        result = RSVP.hash({
          input: readFile(this.inputPath),
          output: readFile(this.outputPath)
        }).then(function(result) {
          var type;
          if (this.render().toString() === result.output.toString()) {
            type = "identical";
          } else {
            type = "confirm";
          }
          return type;
        }.bind(this));
      } else {
        result = "none";
      }

      resolve(result);
    }.bind(this));
  }.bind(this));
};

FileInfo.prototype.confirmOverwriteTask = function() {
  var info = this;

  return function () {
    return confirmOverwrite(info.outputPath).then(function (action){
      info.action = action;
      return info;
    });
  };
};

function processTemplate(path, context) {
  var content = fs.readFileSync(path);
  return _.template(content)(context);
}

function confirmOverwrite(path) {
  var message = chalk.red('Overwrite') + ' ' + path + '?';

  return confirm(message).then(function (response) {
    if (response) {
      return 'overwrite';
    } else {
      return 'skip';
    }
  });
}

module.exports = FileInfo;
