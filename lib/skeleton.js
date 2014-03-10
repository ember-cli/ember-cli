'use strict';

var walkSync = require('./utilities/walk-sync').walkSync,
    fs = require('fs-extra'),
    chalk = require('chalk'),
    RSVP = require('rsvp'),
    _ = require('lodash-node'),
    path = require('path'),
    Promise = RSVP.Promise,
    stat = RSVP.denodeify(fs.stat),
    outputFile = RSVP.denodeify(fs.outputFile),
    sequence = require('./utilities/sequence'),
    readFile = RSVP.denodeify(fs.readFile),
    keypress = require('./ui/keypress'),
    prompt = require('./ui/prompt'),
    FileInfo = require('./models/file_info'),
    npmInstall = require('./actions/npm_install'),
    ui = require('./ui');

function install(intoDir, name, dryRun, skipNpmInstall) {
  var skeletonDir = path.resolve(path.join(__dirname, '..', 'skeleton'));

  var files = walkSync(skeletonDir),
      file;

  function shouldCommit() {
    return !dryRun;
  }

  function skipPostInstall() {
    return dryRun || skipNpmInstall;
  }

  function templateContext() {
    return {
      namespace: name
    };
  }

  function destPath(file) {
    return path.join(intoDir, file);
  }

  function srcPath(file) {
    return path.join(skeletonDir, file);
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
      namespace: name
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

    return npmInstall();
  }

  function markIdenticalToBeSkipped(info) {
    if (info.resolution === 'identical') {
      info.action = 'skip';
    }
  }

  function processFiles(fileList) {

    var fileInfos = fileList.map(buildFileInfo);

    RSVP.filter(fileInfos, isFile).
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
        then(postInstall).
        then(function (code) {
          process.exit(code);
    });
  }

  ui.write('installing\n');

  if (dryRun) {
    ui.write(chalk.yellow('You specified the dry-run flag, so no changes will be written.\n'));
  }

  return processFiles(files);
}

function writeFile(content, dest) {
  return outputFile(dest, content);
}

function isFile(info) {
  return stat(info.inputPath).invoke('isFile');
}

module.exports = {
  installInto: install
};
