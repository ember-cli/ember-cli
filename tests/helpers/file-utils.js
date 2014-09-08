'use strict';

var fs = require('fs-extra');

function exists(path) {
  return fs.existsSync(path);
}

function touch(path, obj) {
  if (!exists(path)) {
    fs.createFileSync(path);
    fs.writeJsonSync(path, obj || {});
  }
}

function replaceFile(path, findString, replaceString) {
  if (exists(path)) {
    var newFile;
    var file = fs.readFileSync(path, 'utf-8');
    var find = new RegExp(findString);
    var match = new RegExp(replaceString);
    if (!file.match(match)) {
      newFile = file.replace(find, replaceString);
      fs.writeFileSync(path, newFile, 'utf-8');
    }
  }
}

module.exports = {
  touch:          touch,
  exists:         exists,
  replaceFile:    replaceFile
};
