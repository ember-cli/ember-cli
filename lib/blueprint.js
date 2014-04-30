'use strict';

var walkSync   = require('walk-sync');
var fs         = require('fs-extra');
var chalk      = require('chalk');
var Promise    = require('./ext/promise');
var path       = require('path');
var stat       = Promise.denodeify(fs.stat);
var writeFile  = Promise.denodeify(fs.outputFile);
var sequence   = require('./utilities/sequence');
var FileInfo   = require('./models/file-info');

function isFile(info) {
  return stat(info.inputPath).invoke('isFile');
}

function Blueprint(blueprintPath, ui) {
  if (!fs.existsSync(blueprintPath)) {
    throw new Error('Unknown Blueprint: ' + blueprintPath);
  }

  this.blueprintPath = blueprintPath;
  this.ui = ui;
}

Blueprint.renamedFiles = {'gitignore': '.gitignore'};

module.exports = Blueprint;
module.exports.main = path.resolve(path.join(__dirname, '..', 'blueprint'));

Blueprint.prototype.files = function() {
  if (this._files) { return this._files; }

  return this._files = walkSync(this.blueprintPath);
};

Blueprint.prototype.srcPath = function(file) {
  return path.join(this.blueprintPath, file);
};

Blueprint.prototype.install = function(intoDir, templateVariables, dryRun) {
  var ui = this.ui;

  var actions = {
    write: function(info) {
      ui.write('  ' + chalk.green('create') + ' ' + info.displayPath + '\n');
      return writeFile(info.outputPath, info.render());
    },

    skip: function(info) {
      var label = 'skip';

      if (info.resolution === 'identical') {
        label = 'identical';
      }

      ui.write('  ' + chalk.yellow(label) + ' ' + info.displayPath + '\n');
    },

    overwrite: function(info) {
      ui.write('  ' + chalk.yellow('overwrite') + ' ' + info.displayPath + '\n');
      if (!dryRun) {
        return writeFile(info.outputPath, info.render());
      }
    }
  };

  function commit(result) {
    var action = actions[result.action];

    if (action) {
      return action(result);
    } else {
      throw new Error('Tried to call action \"' + result.action + '\" but it does not exist');
    }
  }

  ui.write('installing\n');

  if (dryRun) {
    ui.write(chalk.yellow('You specified the dry-run flag, so no changes will be written.\n'));
  }

  return this.processFiles(intoDir, templateVariables).map(commit);
};

Blueprint.prototype.buildFileInfo = function(destPath, templateVariables, file) {
  return new FileInfo({
    action: 'write',
    outputPath: destPath(Blueprint.renamedFiles[file] || file),
    displayPath: file,
    inputPath: this.srcPath(file),
    templateVariables: templateVariables,
    ui: this.ui
  });
};

function prepareConfirm(info) {
  return info.checkForConflict().then(function(resolution) {
    info.resolution = resolution;
    return info;
  });
}

function markIdenticalToBeSkipped(info) {
  if (info.resolution === 'identical') {
    info.action = 'skip';
  }
}

function gatherConfirmationMessages(collection, info) {
  if (info.resolution === 'confirm') {
    collection.push(info.confirmOverwriteTask());
  }
  return collection;
}

Blueprint.prototype.processFiles = function(intoDir, templateVariables) {

  function destPath(file) {
    return path.join(intoDir, file);
  }

  var fileInfos = this.files().
    map(this.buildFileInfo.bind(this, destPath, templateVariables));

  return Promise.filter(fileInfos, isFile).
    map(prepareConfirm).
    then(function(infos) {
      infos.forEach(markIdenticalToBeSkipped);

      var infosNeedingConfirmation = infos.reduce(gatherConfirmationMessages, []);

      return sequence(infosNeedingConfirmation).returns(infos);
    });
};
