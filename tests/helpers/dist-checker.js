'use strict';

const fs = require('fs');
const path = require('path');
// eslint-disable-next-line node/no-unpublished-require
const { JSDOM } = require('jsdom');

class DistChecker {
  constructor(distPath) {
    this.distPath = distPath;

    let html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
    this.dom = new JSDOM(html);
    this.scripts = this.dom.window.document.querySelectorAll('script');
    this.links = this.dom.window.document.querySelectorAll('link');
  }

  contains(fileType, token) {
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
