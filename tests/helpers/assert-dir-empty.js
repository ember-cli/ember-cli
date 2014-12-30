'use strict';

var EOL         = require('os').EOL;
var expect      = require('chai').expect;
var fs          = require('fs');
var walkSync    = require('walk-sync');

/*
 Asserts that the given directory is empty.

 @method assertDirEmpty.
 @param dir The directory to check.
*/
module.exports = function assertDirEmpty(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  var paths = walkSync(dir)
    .filter(function(path) {
      return !path.match(/output\//);
    });

  expect(paths).to.deep.equal([], dir + '/ should be empty after `ember` tasks. Contained: ' + paths.join(EOL));
};