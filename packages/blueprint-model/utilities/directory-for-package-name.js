'use strict';

const path = require('path');

/**
 * Derive a directory name from a package name.
 * Takes scoped packages into account.
 *
 * @method directoryForPackageName
 * @param {String} packageName
 * @return {String} Derived directory name.
 */
module.exports = function directoryForPackageName(packageName) {
  let isScoped = packageName[0] === '@' && packageName.includes('/');

  if (isScoped) {
    let slashIndex = packageName.indexOf('/');
    let scopeName = packageName.substring(1, slashIndex);
    let packageNameWithoutScope = packageName.substring(slashIndex + 1);
    let pathParts = process.cwd().split(path.sep);
    let parentDirectoryContainsScopeName = pathParts.includes(scopeName);

    if (parentDirectoryContainsScopeName) {
      return packageNameWithoutScope;
    } else {
      return `${scopeName}-${packageNameWithoutScope}`;
    }
  } else {
    return packageName;
  }
};
