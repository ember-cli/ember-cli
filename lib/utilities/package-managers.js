'use strict';

const fs = require('fs');

async function determineInstallCommand(projectRoot) {
  if (await isPnpmProject(projectRoot)) {
    return 'pnpm install';
  } else if (isYarnProject(projectRoot)) {
    return 'yarn install';
  } else {
    return 'npm install';
  }
}

async function isPnpmProject(projectRoot) {
  if (fs.existsSync(`${projectRoot}/pnpm-lock.yaml`)) {
    return true;
  }

  const { findWorkspaceDir } = await import('@pnpm/find-workspace-dir');

  if (await findWorkspaceDir(projectRoot)) {
    return true;
  }

  return false;
}

function isYarnProject(projectRoot) {
  if (fs.existsSync(`${projectRoot}/yarn.lock`)) {
    return true;
  }

  const findWorkspaceRoot = require('find-yarn-workspace-root');

  if (findWorkspaceRoot(projectRoot)) {
    return true;
  }

  return false;
}

module.exports = {
  determineInstallCommand,
  isPnpmProject,
  isYarnProject,
};
