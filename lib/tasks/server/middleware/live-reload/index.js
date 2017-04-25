'use strict';

const walkSync = require('walk-sync');
const path = require('path');
const FSTree = require('fs-tree-diff');
const tinylr = require('tiny-lr');
const bodyParser = require('body-parser');
let logger = require('heimdalljs-logger')('ember-cli:live-reload:');

function isNotRemoved(entryTuple) {
  let operation = entryTuple[0];
  return operation !== 'unlink' && operation !== 'rmdir';
}

function isNotDirectory(entryTuple) {
  let entry = entryTuple[2];
  return entry && !entry.isDirectory();
}

function relativePath(patch) {
  return patch[1];
}

function isNotSourceMapFile(file) {
  return !(/\.map$/.test(file));
}

class LiveReloadAddon {
  constructor(project) {
    this.project = project;
    this.name = 'live-reload-middleware';
  }

  serverMiddleware({ app, options }) {
    if (options.liveReload) {
      let { watcher, ui, analytics } = options;

      this.watcher = watcher;
      this.ui = ui;
      this.analytics = analytics;

      app
        .use(bodyParser())
        .use(tinylr.middleware({ app }));

      this.listen(options);
    }
  }

  listen(options) {
    this.tree = new FSTree.fromEntries([]);

    // Reload on file changes
    this.watcher.on('change', function() {
      try {
        this.didChange.apply(this, arguments);
      } catch (e) {
        this.ui.writeError(e);
      }
    }.bind(this));

    // reload on error
    this.watcher.on('error', this.didChange.bind(this));

    let url = `http${options.ssl ? 's' : ''}://${this.displayHost(options.host)}:${options.port}`;
    this.writeBanner.bind(this, url);
  }

  displayHost(specifiedHost) {
    return specifiedHost || 'localhost';
  }

  writeBanner(url) {
    this.ui.writeLine(`Livereload server on ${url}`);
  }

  writeSkipBanner(filePath) {
    this.ui.writeLine(`Skipping livereload for: ${filePath}`);
  }

  getDirectoryEntries(directory) {
    return walkSync.entries(directory);
  }

  shouldTriggerReload(options) {
    let result = true;

    if (this.project.liveReloadFilterPatterns.length > 0) {
      let filePath = path.relative(this.project.root, options.filePath || '');

      result = this.project.liveReloadFilterPatterns
        .every(pattern => pattern.test(filePath) === false);

      if (result === false) {
        this.writeSkipBanner(filePath);
      }
    }

    return result;
  }

  didChange(results) {
    let previousTree = this.tree;
    let files;

    if (results.stack) {
      this._hasCompileError = true;
      files = ['LiveReload due to compile error'];
    } else if (this._hasCompileError) {
      this._hasCompileError = false;
      files = ['LiveReload due to resolved compile error'];
    } else if (results.directory) {
      this.tree = new FSTree.fromEntries(this.getDirectoryEntries(results.directory), { sortAndExpand: true });
      files = previousTree.calculatePatch(this.tree)
        .filter(isNotRemoved)
        .filter(isNotDirectory)
        .map(relativePath)
        .filter(isNotSourceMapFile);

    } else {
      files = ['LiveReload files'];
    }

    logger.info('files %a', files);

    if (this.shouldTriggerReload(results)) {
      tinylr.changed({
        body: {
          files,
        },
      });

      this.analytics.track({
        name: 'broccoli watcher',
        message: 'live-reload',
      });
    }
  }
}

module.exports = LiveReloadAddon;
