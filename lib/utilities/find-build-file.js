'use strict';

var findUp = require('findup');
var path = require('path');

module.exports = function(file) {
  var buildFileDir;
  try {
    buildFileDir = findUp.sync(process.cwd(), file);
  } catch (e) {
    // Note: In the future this should throw
    return null;
  }

  process.chdir(buildFileDir);

  var buildFile = null;
  try {
    buildFile = require(path.join(buildFileDir, file));
  } catch (err) {
    err.message = 'Could not require \'' + file + '\': ' + err.message;
    throw err;
  }

  return buildFile;
};
