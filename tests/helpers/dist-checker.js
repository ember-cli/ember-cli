'use strict';

const fs = require('fs');
const path = require('path');
// eslint-disable-next-line node/no-unpublished-require
const jsdom = require('jsdom');

class CustomResourceLoader extends jsdom.ResourceLoader {
  constructor(distPath) {
    super();
    this.distPath = distPath;
  }

  fetch(url) {
    let content = fs.readFileSync(path.join(this.distPath, url.replace('file://./', '')), 'utf8');
    return Promise.resolve(Buffer.from(content));
  }
}

module.exports = class DistChecker {
  constructor(distPath) {
    this.distPath = distPath;
  }

  _evalHtml(options = {}) {
    let html = fs.readFileSync(path.join(this.distPath, 'index.html'), 'utf8');
    this.dom = new jsdom.JSDOM(html, options);
    this.scripts = this.dom.window.document.querySelectorAll('script');
    this.links = this.dom.window.document.querySelectorAll('link');
  }

  evalScripts(timeout = 15000) {
    const virtualConsole = new jsdom.VirtualConsole();
    const errors = [];
    this._evalHtml({
      url: `file://.`,
      runScripts: 'dangerously',
      resources: new CustomResourceLoader(this.distPath),
      virtualConsole
    });

    // ember-data expects window.crypto to exists however JSDom does not
    // impliment this: https://github.com/jsdom/jsdom/issues/1612
    this.window.crypto = () => {};
    return new Promise((resolve, reject) => {
      // reject if the scripts take longer than 15 seconds to load.
      let timeoutId = setTimeout(reject, timeout);

      virtualConsole.on("jsdomError", e => {
        reject(e);
        console.error(`==================================================================================================`);
        console.error('  DistChecker JSDom failure');
        console.error(`  while evaluating: [${this.distPath}]`);
        console.error(`  while evaluating: [${this.distPath}]`);
        console.error(e);
        console.error(`    ${e.message}`);
        console.error(`    ${e.stack}`);
        console.error(`==================================================================================================`);
        clearTimeout(timeoutId);
      });

      this.window.addEventListener('error', e => {

      });
      this.window.addEventListener('load', () => {
        clearTimeout(timeoutId);
        return resolve();
      });
    });
  }

  get window() {
    return this.dom.window;
  }

  contains(fileType, token) {
    if (!this.dom) {
      this._evalHtml({});
    }

    if (fileType === 'js') {
      for (let element of this.scripts) {
        let src = element.getAttribute('src');
        let content = fs.readFileSync(path.join(this.distPath, src), 'utf8');

        if (content.includes(token)) {
          return true;
        }
      }
    } else if (fileType === 'css') {
      for (let element of this.links) {
        let src = element.getAttribute('href');
        let content = fs.readFileSync(path.join(this.distPath, src), 'utf8');

        if (content.includes(token)) {
          return true;
        }
      }
    }

    return false;
  }
};
