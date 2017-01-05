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
        config.options.rootURL !== '');

      this.addMiddleware(config);
    }
  }

  addMiddleware(config) {
    let app = config.app;
    let options = config.options;
    let watcher = options.watcher;

    let baseURL = options.rootURL === '' ? '/' : cleanBaseURL(options.rootURL || options.baseURL);
    let baseURLRegexp = new RegExp(`^${baseURL}`);

    app.use((req, res, next) => {
      watcher.then(results => {

        let acceptHeaders = req.headers.accept || [];
        let hasHTMLHeader = acceptHeaders.indexOf('text/html') !== -1;
        let isForBaseURL = baseURLRegexp.test(req.path);

        if (hasHTMLHeader && isForBaseURL && req.method === 'GET') {
          let assetPath = req.path.slice(baseURL.length);
          let isFile = false;
          try { isFile = fs.statSync(path.join(results.directory, assetPath)).isFile(); } catch (err) { /* ignore */ }
          if (!isFile) {
            req.serveUrl = `${baseURL}index.html`;
          }
        }
      }).finally(next);
    });
  }
}

module.exports = HistorySupportAddon;
