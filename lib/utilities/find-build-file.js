'use strict';

var findUp = require('findup-sync');
var path = require('path');

module.exports = function(file) {
  var buildFilePath = findUp(file); 

  if (buildFilePath === null) {
    throw new Error(file + ' not found');
  }

  var baseDir = path.dirname(buildFilePath);

  process.chdir(baseDir);

  var buildFile = require(buildFilePath);

  return buildFile;
};