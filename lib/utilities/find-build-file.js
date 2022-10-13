'use strict';
const findUp = require('find-up');
const path = require('path');

// TODO: make rob happy with async import
module.exports = function (dir) {
  let buildFilePath = findUp.sync('ember-cli-build.js', { cwd: dir });

  if (!buildFilePath) {
    buildFilePath = findUp.sync('ember-cli-build.cjs', { cwd: dir });
  }

  // Note: In the future this should throw
  if (!buildFilePath) {
    return null;
  }

  process.chdir(path.dirname(buildFilePath));

  let buildFile = null;
  try {
    buildFile = require(buildFilePath);
  } catch (err) {
    err.message = `Could not require 'ember-cli-build.js': ${err.message}`;
    throw err;
  }

  return buildFile;
};
