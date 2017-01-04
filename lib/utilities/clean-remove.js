'use strict';

var path = require('path');
var fs = require('fs-extra');
var Promise = require('../ext/promise');
var walkUp = require('./walk-up-path');
var stat = Promise.denodeify(fs.stat);
var remove = Promise.denodeify(fs.remove);
var readdir = Promise.denodeify(fs.readdir);

function cleanRemove(fileInfo) {
  // see if file exists to avoid wasting time
  return stat(fileInfo.outputPath)
    .then(() => remove(fileInfo.outputPath))
    .then(() => {
      var paths = walkUp(fileInfo.displayPath)
        .map(thePath => path.join(fileInfo.outputBasePath, thePath));

      return paths.reduce((chainedPromise, thePath) => chainedPromise.then(wasShortCircuited => {
        if (wasShortCircuited) {
          // optimization that says since my child dir wasn't empty,
          // I can't be empty, so keep skipping
          return true;
        }

        // get list of files remaining in this dir
        return readdir(thePath).then(paths => {
          if (paths.length) {
            // don't check parent dirs since this one isn't empty
            return true;
          }

          return remove(thePath).then(() => false);
        });
      }), Promise.resolve());
    })
    .catch(err => {
      if (err.code !== 'ENOENT') {
        throw err;
      }

      // you tried to destroy a blueprint without first generating it
      // instead of trying to read dirs that don't exist
      // swallow error and carry on
    });
}

module.exports = cleanRemove;
