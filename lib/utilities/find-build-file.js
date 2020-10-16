'use strict';
const findUp = require('find-up');

module.exports = function (file, options = {}) {
  let { projectRoot, path } = options;
  let buildFilePath = findUp.sync(file, { cwd: path });

  // Note: In the future this should throw
  if (!buildFilePath) {
    return null;
  }

  process.chdir(projectRoot);

  let buildFile = null;
  try {
    buildFile = require(buildFilePath);
  } catch (err) {
    err.message = `Could not require '${file}': ${err.message}`;
    throw err;
  }

  return buildFile;
};
