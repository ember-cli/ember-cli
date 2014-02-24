"use strict";

var walkSync = require('./utilities/walk-sync').walkSync,
    fs = require('fs-extra'),
    chalk = require('chalk'),
    RSVP = require("rsvp"),
    _ = require('lodash-node'),
    path = require('path'),
    Promise = RSVP.Promise,
    stat = RSVP.denodeify(fs.stat),
    outputFile = RSVP.denodeify(fs.outputFile),
    sequence = require('./utilities/sequence');

function instrument(event) {
  console.log(event.guid, event.eventName, event.label);
}

// RSVP.configure('instrument', true);
RSVP.on('created', instrument);
RSVP.on('chained', instrument);
RSVP.on('fulfilled', instrument);
RSVP.on('rejected', instrument);

// Wnat to use denodeify around stdin.once, but couldn't.
// Got some kind of undefined error down in once
function prompt(name) {
  return new Promise(function(resolve, reject) {
    process.stdin.once("data", function(data) {
      resolve(data);
    });
  }, 'prompt: ' + name);
}

function keypress(stdin) {
  return prompt('keypress').then(function(data) {
    return data.toString().trim();
  });
}

function confirm(question, callback) {
  var stdin = process.stdin, stdout = process.stdout;

  stdin.resume();
  stdout.write(question + " (y/n/q) ");
  stdin.setRawMode(true);

  return new Promise(function(resolve, reject) {
    resolve(keypress(stdin).then(function(data) {

      if (data === "y") {
        return true;
      } else if (data === "q") {
        process.exit(1);
      } else {
        return false;
      }
    }).finally(function() {
      stdout.write("\n");
      stdin.pause();
    }));
  }, 'prompt:' + question);

}

function install(intoDir, name, dryRun) {
  var skeletonDir = path.resolve(path.join(__dirname, "..", "skeleton"));

  var files = walkSync(skeletonDir),
      file;

  function shouldCommit() {
    return !dryRun;
  }

  function templateContext() {
    return {
      namespace: name
    };
  }

  function processTemplate(path) {
    var content = fs.readFileSync(path);
    return _.template(content)(templateContext());
  }

  function destPath(file) {
    return path.join(intoDir, file);
  }

  function srcPath(file) {
    return path.join(skeletonDir, file);
  }

  function confirmOverwriteTask(info) {
    return function() {
      return confirmOverwrite(info.outputPath).then(function(action){
        info.action = action;
        return info;
      });
    };
  }

  function confirmOverwrite(path) {
    var message = chalk.red("Overwrite") + " " + path + "?";

    return confirm(message).then(function(response) {
      if(response) {
        return "overwrite";
      } else {
        return "skip";
      }
    });
  }

  function checkForConflict(path) {
    return new Promise(function(resolve, reject) {
      fs.exists(path, function(doesExist, error) {
        if (error) { reject(error); }

        resolve(doesExist);
      });
    });
  }

  var actions = {
    write: function(info) {
      console.log("\t", chalk.green("create"), info.displayPath);
      if (shouldCommit()) {
        var content = processTemplate(info.inputPath);
        return writeFile(content, info.outputPath);
      }
    },
    skip: function(info) {
      console.log("\t", chalk.yellow("skip"), info.displayPath);
    },
    overwrite: function(info) {
      console.log("\t", chalk.yellow("overwrite"), info.displayPath);
      if (shouldCommit()) {
        var content = processTemplate(info.inputPath);
        return writeFile(content, info.outputPath);
      }
    }
  };

  function buildFileInfo(file) {
    var dest = destPath(file);
    return {
      action: "write",
      shouldConfirm: false,
      outputPath: dest,
      displayPath: file,
      inputPath: srcPath(file)
    };
  }

  function prepareConfirm(info) {
    return checkForConflict(info.outputPath).then(function(shouldConfirm) {
      info.shouldConfirm = shouldConfirm;
      return info;
    });
  }

  function commit(result) {
    var action = actions[result.action];

    if(action) {
      return action.call(null, result);
    } else {
      throw new Error("Tried to call action \"" + result.action + "\" but it does not exist");
    }
  }

  function processFiles(fileList) {

   return Promise.resolve(fileList.map(buildFileInfo)).
        filter(isFile).
        map(prepareConfirm).
        then(function(infos) {

          var infosNeedingConfirmation =
            infos.filter(function(info) {
              return info.shouldConfirm;
            }).map(confirmOverwriteTask);

          return sequence(infosNeedingConfirmation).returns(infos);
        }).map(commit);
  }

  if (dryRun) {
    console.log(chalk.yellow("You specified the dry-run flag, so no changes will be written."));
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
