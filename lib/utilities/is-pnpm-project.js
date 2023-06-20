'use strict';

const fs = require('fs');

/**
 * Returns true if and only if the given directory has a pnpm-lock.yaml file or is a child of a
 * pnpm workspace root.
 * @private
 * @method isPnpmProject
 * @param {string} thePath
 * @return {Promise<boolean>}
 */
async function isPnpmProject(thePath) {
  if (fs.existsSync(`${thePath}/pnpm-lock.yaml`)) {
    return true;
  }

  const { findWorkspaceDir } = await import('@pnpm/find-workspace-dir');

  if (await findWorkspaceDir(thePath)) {
    return true;
  }

  return false;
}

module.exports = isPnpmProject;
