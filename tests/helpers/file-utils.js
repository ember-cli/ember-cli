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

module.exports = {
  touch:          touch,
  exists:         exists,
};
