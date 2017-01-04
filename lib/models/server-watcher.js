'use strict';

let Watcher = require('./watcher');

let ServerWatcher = Watcher.extend({
  constructWatcher(options) {
    return new (require('sane'))(this.watchedDir, options);
  },

  init() {
    this._super.init.apply(this, arguments);

    this.watcher.on('add', this.didAdd.bind(this));
    this.watcher.on('delete', this.didDelete.bind(this));
  },

  didChange(relativePath) {
    let description = `File changed: "${relativePath}"`;

    this.ui.writeLine(description);
    this.analytics.track({
      name: 'server file changed',
      description,
    });
  },

  didAdd(relativePath) {
    let description = `File added: "${relativePath}"`;

    this.ui.writeLine(description);
    this.analytics.track({
      name: 'server file addition',
      description,
    });
  },

  didDelete(relativePath) {
    let description = `File deleted: "${relativePath}"`;

    this.ui.writeLine(description);
    this.analytics.track({
      name: 'server file deletion',
      description,
    });
  },
});

module.exports = ServerWatcher;
