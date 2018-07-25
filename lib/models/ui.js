'use strict';

const UI = require('console-ui');
const ciInfo = require('ci-info');

let singletonUI;

/**
 * The class that serves as a singleton wrapper for `console-ui`.
 *
 * @private
 * @module ember-cli
 * @class CommandLineUI
 * @constructor
 */
class CommandLineUI {
  constructor(args) {
    let options = args || {};

    if (!singletonUI) {
      singletonUI = new UI({
        inputStream: options.inputStream,
        outputStream: options.outputStream,
        errorStream: options.errorStream || process.stderr,
        errorLog: options.errorLog || [],
        ci: ciInfo.isCI || (/^(dumb|emacs)$/).test(process.env.TERM),
        writeLevel: (process.argv.indexOf('--silent') !== -1) ? 'ERROR' : undefined,
      });
    }

    return singletonUI;
  }
}

module.exports = CommandLineUI;
