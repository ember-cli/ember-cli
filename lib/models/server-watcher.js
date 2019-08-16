'use strict';

const Watcher = require('./watcher');

module.exports = class ServerWatcher extends Watcher {
  constructor(options) {
    super(options);

    this.watcher.on('add', this.didAdd.bind(this));
    this.watcher.on('delete', this.didDelete.bind(this));
  }

  // This branch can be removed once BROCCOLI_WATCHER is enabled by default
  constructWatcher(options) {
    return this.constructBroccoliWatcher(options);
  }

  constructBroccoliWatcher(options) {
    return new (require('sane'))(this.watchedDir, options);
  }

  setupBroccoliChangeEvent() {
    this.watcher.on('change', this.didChange.bind(this));
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
