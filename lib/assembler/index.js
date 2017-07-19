'use strict';

const path = require('path');
const Funnel = require('broccoli-funnel');
const ConfigLoader = require('broccoli-config-loader');

class Assembler {
  constructor(options) {
    this.env = options.env;
    this.name = options.name;
    this.tests = options.tests;
    this.project = options.project;

    this._cachedConfigTree = null;
  }

  getConfigTree() {
    if (!this._cachedConfigTree) {
      let configPath = this.project.configPath();
      let configTree = new ConfigLoader(path.dirname(configPath), {
        env: this.env,
        tests: this.tests,
        project: this.project,
      });

      this._cachedConfigTree = new Funnel(configTree, {
        srcDir: '/',
        destDir: `${this.name}/config`,
        annotation: 'Funnel (config)',
      });
    }

    return this._cachedConfigTree;
  }
}

module.exports = Assembler;
