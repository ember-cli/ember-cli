'use strict';

const path = require('path');
const existsSync = require('exists-sync');
const fs = require('fs-extra');
const minimatch = require('minimatch');

/**
 * Returns true iff the given directory has a yarn.lock file or is a child of a
 * yarn workspace root.
 * @private
 * @method discoverYarn
 * @param {string} thePath
 * @return {boolean}
 */
function discoverYarn(thePath) {
  if (existsSync(path.join(thePath, 'yarn.lock'))) {
    return true;
  }

  if (findWorkspaceRoot(thePath)) {
    return true;
  }

  return false;
}

module.exports = discoverYarn;

/**
 * Adapted from:
 * https://github.com/yarnpkg/yarn/blob/ddf2f9ade211195372236c2f39a75b00fa18d4de/src/config.js#L612
 * @private
 * @method findWorkspaceRoot
 * @param {string} initial
 * @return {string|null}
 */
function findWorkspaceRoot(initial) {
  let previous = null;
  let current = path.normalize(initial);

  do {
    const manifest = readPackageJSON(current);
    if (manifest && manifest.workspaces) {
      const relativePath = path.relative(current, initial);
      if (relativePath === '' || matchAny(relativePath, manifest.workspaces)) {
        return current;
      } else {
        return null;
      }
    }

    previous = current;
    current = path.dirname(current);
  } while (current !== previous);

  return null;
}

function readPackageJSON(dir) {
  const file = path.join(dir, 'package.json');
  if (existsSync(file)) {
    return fs.readJsonSync(file);
  }
  return null;
}

function matchAny(fileName, patterns) {
  for (let i = 0; i < patterns.length; i++) {
    if (minimatch(fileName, patterns[i])) {
      return true;
    }
  }
  return false;
}
