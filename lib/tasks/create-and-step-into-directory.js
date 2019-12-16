'use strict';

// Creates a directory with the name directoryName in cwd and then sets cwd to
// this directory.

const fs = require('fs-extra');
const path = require('path');
const Task = require('../models/task');
const SilentError = require('silent-error');

// used in order to infer the directory to use, if `--directory` was specified
// to `ember new`/`ember addon` it will **always** be used directly (without
// modification)
function chooseDirectoryName(projectName) {
  let isScoped = projectName[0] === '@' && projectName.includes('/');

  if (isScoped) {
    let slashIndex = projectName.indexOf('/');
    let scopeName = projectName.substring(1, slashIndex);
    let packageNameWithoutScope = projectName.substring(slashIndex + 1);
    let pathParts = process.cwd().split(path.sep);

    let parentDirectoryContainsScopeName = pathParts.includes(scopeName);

    if (parentDirectoryContainsScopeName) {
      return packageNameWithoutScope;
    } else {
      return `${scopeName}-${packageNameWithoutScope}`;
    }
  } else {
    return projectName;
  }
}

class CreateTask extends Task {
  // Options: String directoryName, Boolean: dryRun

  warnDirectoryAlreadyExists(directoryName) {
    let message = `Directory '${directoryName}' already exists.`;
    return new SilentError(message);
  }

  async run(options) {
    let directoryName = options.directoryName ? options.directoryName : chooseDirectoryName(options.projectName);

    if (options.dryRun) {
      if (fs.existsSync(directoryName) && fs.readdirSync(directoryName).length) {
        throw this.warnDirectoryAlreadyExists(directoryName);
      }

      return;
    }

    try {
      await fs.mkdir(directoryName);
    } catch (err) {
      if (err.code === 'EEXIST') {
        // Allow using directory if it is empty.
        if (fs.readdirSync(directoryName).length) {
          throw this.warnDirectoryAlreadyExists(directoryName);
        }
      } else {
        throw err;
      }
    }
    let cwd = process.cwd();
    process.chdir(directoryName);

    return { initialDirectory: cwd, projectDirectory: directoryName };
  }
}

module.exports = CreateTask;
