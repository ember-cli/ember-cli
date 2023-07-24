'use strict';

const path = require('path');
const fs = require('fs');
const cleanBaseURL = require('clean-base-url');

class HistorySupportAddon {
  /**
   * This addon is used to serve the `index.html` file at every requested
   * URL that begins with `rootURL` and is expecting `text/html` output.
   *
   * @class HistorySupportAddon
   * @constructor
   */
  constructor(project) {
    this.project = project;
    this.name = 'history-support-middleware';
  }

  shouldAddMiddleware(environment) {
    let config = this.project.config(environment);
    let locationType = config.locationType;
    let historySupportMiddleware = config.historySupportMiddleware;

    if (typeof historySupportMiddleware === 'boolean') {
      return historySupportMiddleware;
    }

    return ['auto', 'history'].indexOf(locationType) !== -1;
  }

  serverMiddleware(config) {
    if (this.shouldAddMiddleware(config.options.environment)) {
      this.project.ui.writeWarnLine(
        'Empty `rootURL` is not supported. Disable history support, or use an absolute `rootURL`',
        config.options.rootURL !== ''
      );

      this.addMiddleware(config);
    }
  }

  addMiddleware(config) {
    let app = config.app;
    let options = config.options;
    let watcher = options.watcher;
    let rootURL = options.rootURL === '' ? '/' : cleanBaseURL(options.rootURL);

    app.use(async (req, _, next) => {
      try {
        let results;
        try {
          results = await watcher;
        } catch (e) {
          // This means there was a build error, so we won't actually be serving
          // index.html, and we have nothing to do. We have to catch it here,
          // though, or it will go uncaught and cause the process to exit.
          return;
        }

        if (this.shouldHandleRequest(req, options)) {
          let assetPath = req.path.slice(rootURL.length);
          let isFile = false;

          try {
            isFile = fs.statSync(path.join(results.directory, assetPath)).isFile();
          } catch (err) {
            /* ignore */
          }
          if (!isFile) {
            req.serveUrl = `${rootURL}index.html`;
          }
        }
      } finally {
        next();
      }
    });
  }

  shouldHandleRequest(req, options) {
    let acceptHeaders = req.headers.accept || [];
    let hasHTMLHeader = acceptHeaders.indexOf('text/html') !== -1;
    if (req.method !== 'GET') {
      return false;
    }
    if (!hasHTMLHeader) {
      return false;
    }
    let rootURL = options.rootURL === '' ? '/' : cleanBaseURL(options.rootURL);
    if (req.path.startsWith(rootURL)) {
      return true;
    }
    // exactly match the rootURL without a trailing slash
    if (req.path === rootURL.slice(0, -1)) {
      return true;
    }
    return false;
  }
}

module.exports = HistorySupportAddon;
