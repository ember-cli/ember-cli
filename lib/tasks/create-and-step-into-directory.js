'use strict';

// Creates a directory with the name directoryName in cwd and then sets cwd to
// this directory.

const fs = require('fs-extra');
const Task = require('../models/task');
const SilentError = require('silent-error');
const directoryForPackageName = require('../utilities/directory-for-package-name');

class CreateTask extends Task {
  // Options: String directoryName, Boolean: dryRun

  warnDirectoryAlreadyExists(directoryName) {
    let message = `Directory '${directoryName}' already exists.`;
    return new SilentError(message);
  }

  async run(options) {
    let directoryName = options.directoryName ? options.directoryName : directoryForPackageName(options.projectName);

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
