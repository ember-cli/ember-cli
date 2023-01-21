'use strict';

const fs = require('fs');
const path = require('path');
// eslint-disable-next-line n/no-unpublished-require
const jsdom = require('jsdom');
const { AssertionError } = require('assert');

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

class DistChecker {
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
    this._evalHtml({
      url: `file://.`,
      runScripts: 'dangerously',
      resources: new CustomResourceLoader(this.distPath),
    });

    // ember-data expects window.crypto to exists however JSDom does not
    // impliment this: https://github.com/jsdom/jsdom/issues/1612
    this.dom.window.crypto = () => {};
    return new Promise((resolve, reject) => {
      // reject if the scripts take longer than 15 seconds to load.
      let timeoutId = setTimeout(() => {
        reject(
          new AssertionError({
            operator: 'evalScripts[Timeout]',
            message: `[dist-checker:${this.distPath}] timeout exceeded: ${timeout}`,
            stackStartFn: this.evalScripts,
          })
        );
      }, timeout);

      this.dom.window.addEventListener('error', (e) => {
        reject(
          new AssertionError({
            operator: 'evalScripts',
            // this `e` has no stack, so we must make due
            message: `error thrown during evalScript of '${this.distPath}' \n error details: \n   message: '${e.message}'\n   file: '${e.filename}:${e.colno}'`,
            stackStartFn: this.evalScripts,
          })
        );
      });

      this.dom.window.addEventListener('load', () => {
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
}

module.exports = DistChecker;
