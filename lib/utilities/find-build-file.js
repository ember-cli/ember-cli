'use strict';

var findUp = require('find-up');
var path = require('path');

module.exports = function(file) {
  var buildFilePath = findUp.sync(file);

  // Note: In the future this should throw
  if (!buildFilePath) {
    return null;
  }

  process.chdir(path.dirname(buildFilePath));

  var buildFile = null;
  try {
    buildFile = require(buildFilePath);
  } catch (err) {
    err.message = 'Could not require \'' + file + '\': ' + err.message;
    throw err;
  }

  return buildFile;
};
