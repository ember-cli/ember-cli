'use strict';

const path = require('path');
const fs = require('fs-extra');
const walkUp = require('./walk-up-path');

async function cleanRemove(fileInfo) {
  try {
    await fs.stat(fileInfo.outputPath);
    await fs.remove(fileInfo.outputPath);
    let paths = walkUp(fileInfo.displayPath).map((thePath) => path.join(fileInfo.outputBasePath, thePath));

    return paths.reduce(
      (chainedPromise, thePath) =>
        chainedPromise.then(async (wasShortCircuited) => {
          if (wasShortCircuited) {
            // optimization that says since my child dir wasn't empty,
            // I can't be empty, so keep skipping
            return true;
          }

          // get list of files remaining in this dir
          let paths = await fs.readdir(thePath);
          if (paths.length) {
            // don't check parent dirs since this one isn't empty
            return true;
          }

          await fs.remove(thePath);
          return false;
        }),
      Promise.resolve()
    );
  } catch (err) {
    // you tried to destroy a blueprint without first generating it
    // instead of trying to read dirs that don't exist
    // swallow error and carry on
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

module.exports = cleanRemove;
