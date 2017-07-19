'use strict';

const path = require('path');
const Funnel = require('broccoli-funnel');
const ConfigLoader = require('broccoli-config-loader');
const mergeTrees = require('../broccoli/merge-trees');

function podTemplates(name, appTree, registry) {
  let patterns = registry.extensionsForType('template')
    .map(extension => `**/*/template.${extension}`);

  return new Funnel(appTree, {
    include: patterns,
    exclude: ['templates/**/*'],
    destDir: `${name}/`,
    annotation: 'Funnel: Pod Templates',
  });
}

/*

  This is the first (compat) version of assembler.

 */
class Assembler {
  /*
    @class Assembler
    @constructor
    @param {Object} [options={}] Configuration options
   */
  constructor(options) {
    this.env = options.env;
    this.name = options.name;
    this.tests = options.tests;
    this.trees = options.trees;
    this.project = options.project;
    this.registry = options.registry;

    this._cachedConfigTree = null;
    this._cachedTemplatesTree = null;
  }

  /*
    Returns a tree that contains configuration tree, based on configuration path.

    Given `the-best-app-ever/config/environment.js`, the tree produced is

    ```
    the-best-app-ever/
      config/
        environments/
          development.json
          test.json
    ```
   */
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

  getAppTemplatesTree() {
    if (!this._cachedTemplatesTree) {
      let trees = [];
      if (this.trees.templates) {
        let standardTemplates = new Funnel(this.trees.templates, {
          srcDir: '/',
          destDir: `${this.name}/templates`,
          annotation: 'Funnel: Templates',
        });

        trees.push(standardTemplates);
      }

      if (this.trees.app) {
        trees.push(podTemplates());
      }

      this._cachedTemplatesTree = mergeTrees(trees, {
        annotation: 'TreeMerge (templates)',
      });
    }

    return this._cachedTemplatesTree;
  }

  /*
    this.getAddonTrees('templates') => [tree1, tree2]
   */

  // getAddonTrees(type) {

  // }
}

module.exports = Assembler;
