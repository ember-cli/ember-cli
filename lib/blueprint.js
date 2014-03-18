'use strict';

var walkSync = require('./utilities/walk-sync').walkSync;
var fs = require('fs-extra');
var chalk = require('chalk');
var RSVP = require('rsvp');
var path = require('path');
var stat = RSVP.denodeify(fs.stat);
var outputFile = RSVP.denodeify(fs.outputFile);
var sequence = require('./utilities/sequence');
var FileInfo = require('./models/file-info');
var npmInstall = require('./actions/npm-install');
var bowerInstall = require('./actions/bower-install');
var ui = require('./ui');

function writeFile(content, dest) {
  return outputFile(dest, content);
}

function isFile(info) {
  return stat(info.inputPath).invoke('isFile');
}

function install(intoDir, templateVariables, dryRun, skipNpmInstall) {
  var blueprintDir = path.resolve(path.join(__dirname, '..', 'blueprint'));
  var files = walkSync(blueprintDir);

  function shouldCommit() {
    return !dryRun;
  }

  function skipPostInstall() {
    return dryRun || skipNpmInstall;
  }

  function destPath(file) {
    return path.join(intoDir, file);
  }

  function srcPath(file) {
    return path.join(blueprintDir, file);
  }

  var actions = {
    write: function (info) {
      ui.write('  ' + chalk.green('create') + ' ' +info.displayPath + '\n');

      if (shouldCommit()) {
        return writeFile(info.render(), info.outputPath);
      }
    },

    skip: function (info) {
      var label = 'skip';
      if (info.resolution === 'identical') {
        label = 'identical';
      }

      ui.write('  ' + chalk.yellow(label) + ' ' + info.displayPath + '\n');
    },

    overwrite: function (info) {
      ui.write('  ' + chalk.yellow('overwrite') + ' ' + info.displayPath + '\n');
      if (shouldCommit()) {
        return writeFile(info.render(), info.outputPath);
      }
    }
  };

  function buildFileInfo(file) {
    return new FileInfo({
      action: 'write',
      outputPath: destPath(file),
      displayPath: file,
      inputPath: srcPath(file),
      templateVariables: templateVariables
    });
  }

  function prepareConfirm(info) {
    return info.checkForConflict().then(function (resolution) {
      info.resolution = resolution;
      return info;
    });
  }

  function commit(result) {
    var action = actions[result.action];

    if (action) {
      return action.call(null, result);
    } else {
      throw new Error('Tried to call action \"' + result.action + '\" but it does not exist');
    }
  }

  function postInstall() {
    if (skipPostInstall()) {
      ui.write(chalk.yellow('Skipping `npm install`..\n'));
      return 0;
    }

    return npmInstall().then(bowerInstall);
  }

  function markIdenticalToBeSkipped(info) {
    if (info.resolution === 'identical') {
      info.action = 'skip';
    }
  }

  function processFiles(fileList) {
    var fileInfos = fileList.map(buildFileInfo);

    return RSVP.filter(fileInfos, isFile).
      map(prepareConfirm).
      then(function (infos) {
        infos.forEach(markIdenticalToBeSkipped);

        var infosNeedingConfirmation =
          infos.filter(function (info) {
            return info.resolution === 'confirm';
          }).map(function(info) {
            return info.confirmOverwriteTask();
          });

        return sequence(infosNeedingConfirmation).returns(infos);
      }).map(commit).
        then(postInstall);
  }

  ui.write('installing\n');

  if (dryRun) {
    ui.write(chalk.yellow('You specified the dry-run flag, so no changes will be written.\n'));
  }

  return processFiles(files);
}

module.exports = {
  installInto: install
};
