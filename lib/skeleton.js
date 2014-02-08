var walkSync = require('./utilities/walk-sync').walkSync,
    fs = require('fs-extra'),
    chalk = require('chalk'),
    _ = require('lodash-node'),
    path = require('path');

function install(intoDir) {
  var skeletonDir = path.resolve(path.join(__dirname, "..", "skeleton"));

  var files = walkSync(skeletonDir);

  files.forEach(function(file) {
    console.log("Copying file ", chalk.underline(file));
    var srcPath = path.join(skeletonDir, file),
        destPath = path.join(intoDir, file);
    if(isFile(srcPath)) {
      var processed = processTemplate(srcPath);
      writeFile(processed, destPath);
    }
  });

}

function processTemplate(path) {
  var content = fs.readFileSync(path);
  return _.template(content)();
}

function writeFile(content, dest) {
  fs.outputFile(dest, content, function(err){
    if(err) {
      console.error(err);
    }
  });
}

function isFile(file) {
  var stats = fs.statSync(file);
  // console.log(file, stats);
  return stats.isFile();
}

module.exports = { installInto: install };
