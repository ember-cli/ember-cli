'use strict';

const Watcher = require('./watcher');

class ServerWatcher extends Watcher {
  constructor(options) {
    super(options);

    this.watcher.on('add', this.didAdd.bind(this));
    this.watcher.on('delete', this.didDelete.bind(this));
  }

  constructWatcher(options) {
    return new (require('sane'))(this.watchedDir, options);
  }

  didChange(relativePath) {
    let description = `File changed: "${relativePath}"`;

    this.ui.writeLine(description);
    this.analytics.track({
      name: 'server file changed',
      description,
    });
  }

  didAdd(relativePath) {
    let description = `File added: "${relativePath}"`;

    this.ui.writeLine(description);
    this.analytics.track({
      name: 'server file addition',
      description,
    });
  }

  didDelete(relativePath) {
    let description = `File deleted: "${relativePath}"`;

    this.ui.writeLine(description);
    this.analytics.track({
      name: 'server file deletion',
      description,
    });
  }
}

module.exports = ServerWatcher;
