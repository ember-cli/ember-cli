'use strict';

var fs      = require('fs');
var Promise = require('../../lib/ext/promise');

module.exports = function copyFile(src, dest) {
  return new Promise(function(resolve) {
    // http://stackoverflow.com/a/11295106/1703845
    resolve(fs.createReadStream(src).pipe(fs.createWriteStream(dest)));
  });
};
