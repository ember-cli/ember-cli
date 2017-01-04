'use strict';

// Creates a directory with the name directoryName in cwd and then sets cwd to
// this directory.

let Promise = require('../ext/promise');
let fs = require('fs');
let existsSync = require('exists-sync');
let mkdir = Promise.denodeify(fs.mkdir);
let Task = require('../models/task');
let SilentError = require('silent-error');

module.exports = Task.extend({
  // Options: String directoryName, Boolean: dryRun

  warnDirectoryAlreadyExists: function warnDirectoryAlreadyExists() {
    let message = `Directory '${this.directoryName}' already exists.`;
    return new SilentError(message);
  },

  run(options) {
    let directoryName = this.directoryName = options.directoryName;
    if (options.dryRun) {
      return new Promise((resolve, reject) => {
        if (existsSync(directoryName) && fs.readdirSync(directoryName).length) {
          return reject(this.warnDirectoryAlreadyExists());
        }
        resolve();
      });
    }

    return mkdir(directoryName)
      .catch(err => {
        if (err.code === 'EEXIST') {
          // Allow using directory if it is empty.
          if (fs.readdirSync(directoryName).length) {
            throw this.warnDirectoryAlreadyExists();
          }
        } else {
          throw err;
        }
      })
      .then(() => {
        let cwd = process.cwd();
        process.chdir(directoryName);
        return { initialDirectory: cwd };
      });
  },
});
