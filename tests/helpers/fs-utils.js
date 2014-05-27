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

function touchIfExists(path, obj) {
  if (!exists(path)) {
    fs.writeJsonSync(path, obj || {});
  } else {
    return fs.readJsonSync(path);
  }
  return obj;
}

function deleteIfExists(path) {
  if (fs.existsSync(path)) {
    return fs.unlinkSync(path);
  }
}

function getUserHome() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

module.exports = {
  touch:          touch,
  touchIfExists:  touchIfExists,
  exists:         exists,
  getUserHome:    getUserHome,
  deleteIfExists: deleteIfExists
};
