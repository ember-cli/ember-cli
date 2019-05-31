'use strict';

const Watcher = require('./watcher');
const { isExperimentEnabled } = require('../experiments');

module.exports = class ServerWatcher extends Watcher {
  constructor(options) {
    super(options);

    this.watcher.on('add', this.didAdd.bind(this));
    this.watcher.on('delete', this.didDelete.bind(this));

    if (isExperimentEnabled('BROCCOLI_WATCHER')) {
      this.watcher.on('change', this.didChange.bind(this));
    }
  }

  // This branch can be removed once BROCCOLI_WATCHER is enabled by default
  constructWatcher(options) {
    return this.constructBroccoliWatcher(options);
  }

  constructBroccoliWatcher(options) {
    return new (require('sane'))(this.watchedDir, options);
  }

  didChange(relativePath) {
    this.ui.writeLine(`File changed: "${relativePath}"`);
  }

  didAdd(relativePath) {
    this.ui.writeLine(`File added: "${relativePath}"`);
  }

  didDelete(relativePath) {
    this.ui.writeLine(`File deleted: "${relativePath}"`);
  }
};
