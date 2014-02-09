var walkSync = require('./utilities/walk-sync').walkSync,
    fs = require('fs-extra'),
    chalk = require('chalk'),
    RSVP = require("rsvp"),
    _ = require('lodash-node'),
    path = require('path');

RSVP.on("error", function(error) {
  console.error(error);
  console.error(error.stack);
});

function keypress(stdin) {
  return new RSVP.Promise(function(resolve) {
    stdin.once("data", function(data) {
      resolve(data.toString().trim());
    });
  });
}

function confirm(question, callback) {
  var stdin = process.stdin, stdout = process.stdout;

  stdin.resume();
  stdout.write(question + " (y/n) ");
  stdin.setRawMode(true);

  return new RSVP.Promise(function(resolve, reject) {
    keypress(stdin).then(function(data) {
      console.log("got data: ", data);

      if(data == "y") {
        resolve(true);
      } else if(data == "q") {
        process.exit(1);
      } else {
        resolve(false);
      }
    }).finally(function() {
      stdin.pause();
    });
  });

}

function install(intoDir, name) {
  var skeletonDir = path.resolve(path.join(__dirname, "..", "skeleton"));

  var files = walkSync(skeletonDir),
      file;

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

  function confirmOverwrite(path) {
    var message = chalk.red("Overwrite") + " " + path + "?";
    return confirm(message);
  }

  function checkForConflict(info) {
    return new RSVP.Promise(function(resolve, reject) {
      if(fs.existsSync(info.outputPath)) {
        confirmOverwrite(info.outputPath).then(function(result) {
          if(result) {
            info.action = "overwrite";
          } else {
            info.action = "skip";
          }
          resolve(info)
        }).catch(reject);
      } else {
        resolve(info);
      }
    });
  }

  var actions = {
    write: function(info) {
      console.log("\t", chalk.green("create"), info.path);
      var content = processTemplate(info.inputPath);
      writeFile(content, info.outputPath);
    },
    skip: function(info) {
      console.log("\t", chalk.yellow("skip"), info.path);
    },
    overwrite: function(info) {
      console.log("\t", chalk.yellow("overwrite"), info.path);
      var content = processTemplate(info.inputPath);
      writeFile(content, info.outputPath);
    }
  };

  function buildFileInfo(file) {
    var dest = destPath(file);
    return {
      action: "write",
      outputPath: dest,
      path: file,
      inputPath: srcPath(file)
    };
  }

  function processEach(info, next) {
    return new RSVP.Promise(function(resolve, reject) {

      checkForConflict(info).then(function(result) {

        var action = actions[result.action];

        if(action) {
          action.call(null, result);
        } else {
          throw new Error("Tried to call action \"" + result.action + "\" but it does not exist");
        }

        var nextFile;
        if(nextFile = next()) {
          processEach(nextFile, next);
        } else {
          resolve();
        }
      });
    });
  }

  function processFiles(fileList) {
    function nextFile() {
      return fileList.pop();
    }

    fileList = fileList.map(buildFileInfo).filter(isFile);

    fileList = fileList.filter(isFile);

    return processEach(fileList[0], nextFile);
  }


  processFiles(files).then(function(results) {
    process.exit();
  });

}

function writeFile(content, dest) {
  fs.outputFile(dest, content, function(err){
    if(err) {
      console.error(err);
    }
  });
}

function isFile(info) {
  var stats = fs.statSync(info.inputPath);
  return stats.isFile();
}

module.exports = { installInto: install };
