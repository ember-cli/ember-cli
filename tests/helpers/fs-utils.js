'use strict';

var fs = require('fs-extra');

var exists = function exists(path) {
  return fs.existsSync(path);
};

var touch = function touch(path, obj) {
  if (!exists(path)) {
    fs.writeJsonSync(path, obj || {});
  }
};

var deleteIfExists = function deleteIfExists(path) {
  if (fs.existsSync(path)) {
    return fs.unlinkSync(path);
  }
};

var getUserHome = function getUserHome() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
};

module.exports = {
  touch:          touch,
  exists:         exists,
  getUserHome:    getUserHome,
  deleteIfExists: deleteIfExists
};
