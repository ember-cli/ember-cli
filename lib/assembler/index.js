'use strict';

const path = require('path');
const Funnel = require('broccoli-funnel');
const ConfigLoader = require('broccoli-config-loader');
const mergeTrees = require('../broccoli/merge-trees');

function podTemplatesPatterns(registry) {
  return registry.extensionsForType('template')
    .map(extension => `**/*/template.${extension}`);
}

function podTemplates(name, appTree, registry) {
  return new Funnel(appTree, {
    include: podTemplatesPatterns(registry),
    exclude: ['templates/**/*'],
    destDir: `${name}/`,
    annotation: 'Funnel: Pod Templates',
  });
}

function reduceTreeForByType(addons, type) {
  return addons.reduce((sum, addon) => {
    if (addon.treeFor) {
      let val = addon.treeFor(type);
      if (val) { sum.push(val); }
    }
    return sum;
  }, []);
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
    this._cachedAppTree = null;
    this._cachedExternalTree = null;
    this._cachedAddonTrees = null;
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

  /*
    Returns a tree that contains application templates.

    Given:

    ```
    application.hbs
    index.hbs
    components/
      x-tree.hbs
    ```

    Returns:

    ```
    the-best-app-ever/
      templates/
        application.hbs
        index.hbs
        components/
          x-tree.hbs
    ````
   */
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
        trees.push(podTemplates(this.name, this.trees.app, this.registry));
      }

      this._cachedTemplatesTree = mergeTrees(trees, {
        annotation: 'TreeMerge (templates)',
      });
    }

    return this._cachedTemplatesTree;
  }

  /*
    Filters styles and templates from the `app` tree.

    Given:

    ```
    the-best-app-ever/
      styles/
        app.css
      templates/
        application.hbs
      app.js
      router.js
    ```

    Returns:

    ```
    the-best-app-ever/
      app.js
      router.js
    ```
   */
  getAppTree() {
    if (!this.trees.app) {
      return;
    }

    if (!this._cachedAppTree) {
      let podPatterns = podTemplatesPatterns(this.registry);
      let excludePatterns = podPatterns.concat([
        // note: do not use path.sep here Funnel uses
        // walk-sync which always joins with `/` (not path.sep)
        'styles/**/*',
        'templates/**/*',
      ]);

      this._cachedAppTree = new Funnel(this.trees.app, {
        exclude: excludePatterns,
        annotation: 'Funnel: Filtered App',
      });
    }

    return this._cachedAppTree;
  }

  /*
    Returns an array of trees from addons
   */
  getAddonTrees() {
    return reduceTreeForByType(this.project.addons, 'addon');
  }

  /*
    Returns an array of trees with templates from addons.
   */
  getAddonTemplatesTrees() {
    return reduceTreeForByType(this.project.addons, 'templates');
  }

  /*
    Returns an array of trees with javascript from addons.
   */
  getAddonAppTrees() {
    return reduceTreeForByType(this.project.addons, 'app');
  }
}

module.exports = Assembler;
