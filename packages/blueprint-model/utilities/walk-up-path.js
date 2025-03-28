'use strict';

const path = require('path');

let regex = /^[./]$/;

function walkUp(thePath) {
  let paths = [];

  let currentPath = thePath;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    currentPath = path.dirname(currentPath);
    if (regex.test(currentPath)) {
      break;
    }
    paths.push(currentPath);
  }

  return paths;
}

module.exports = walkUp;
