'use strict';

var path = require('path');

var regex = /^[\./]$/;

function walkUp(thePath) {
  var paths = [];

  var currentPath = thePath;
  while (true) { // eslint-disable-line no-constant-condition
    currentPath = path.dirname(currentPath);
    if (regex.test(currentPath)) {
      break;
    }
    paths.push(currentPath);
  }

  return paths;
}

module.exports = walkUp;
