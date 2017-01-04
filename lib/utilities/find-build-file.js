'use strict';

const findUp = require('find-up');
const path = require('path');

module.exports = function(file) {
  let buildFilePath = findUp.sync(file);

  // Note: In the future this should throw
  if (!buildFilePath) {
    return null;
  }

  process.chdir(path.dirname(buildFilePath));

  let buildFile = null;
  try {
    buildFile = require(buildFilePath);
  } catch (err) {
    err.message = `Could not require '${file}': ${err.message}`;
    throw err;
  }

  return buildFile;
};
