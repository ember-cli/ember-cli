'use strict';

const Watcher = require('./watcher');

module.exports = class ServerWatcher extends Watcher {
  static async build(options, build) {
    let { watcher: instance } = await super.build(options, build);

    instance.watcher.on('add', instance.didAdd.bind(instance));
    instance.watcher.on('delete', instance.didDelete.bind(instance));

    return { watcher: instance };
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
