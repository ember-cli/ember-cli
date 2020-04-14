'use strict';

const path = require('path');
const fs = require('fs-extra');
const walkUp = require('./walk-up-path');

async function cleanRemove(fileInfo) {
  try {
    await fs.stat(fileInfo.outputPath);
    await fs.remove(fileInfo.outputPath);
    let paths = walkUp(fileInfo.displayPath).map((thePath) => path.join(fileInfo.outputBasePath, thePath));

    for (let thePath of paths) {
      let childPaths = await fs.readdir(thePath);
      if (childPaths.length > 0) {
        return;
      }

      await fs.remove(thePath);
    }
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
