'use strict';

const p = require('ember-cli-preprocess-registry/preprocessors');

const fs = require('fs');
const path = require('path');
const Funnel = require('broccoli-funnel');
const shimAmd = require('./amd-shim');
const existsSync = require('exists-sync');
const mergeTrees = require('./merge-trees');
const cleanBaseURL = require('clean-base-url');
const UnwatchedDir = require('broccoli-source').UnwatchedDir;
const ConfigLoader = require('broccoli-config-loader');
const ConfigReplace = require('broccoli-config-replace');
const addonProcessTree = require('../utilities/addon-process-tree');

let preprocessJs = p.preprocessJs;
let preprocessTemplates = p.preprocessTemplates;

function calculateRootURL(config) {
  if (config.rootURL === '') {
    return config.rootURL;
  }

  return cleanBaseURL(config.rootURL) || '';
}

function calculateEmberENV(config) {
  return JSON.stringify(config.EmberENV || {});
}

function calculateModulePrefix(config) {
  return config.modulePrefix;
}

function calculateBaseTag(config) {
  let baseURL = cleanBaseURL(config.baseURL);
  let locationType = config.locationType;

  if (locationType === 'hash') {
    return '';
  }

  if (baseURL) {
    return `<base href="${baseURL}" />`;
  } else {
    return '';
  }
}

function calculateAppConfig(config) {
  return JSON.stringify(config.APP || {});
}

/*
 Assembler is the first step in the "Packaging" phase of an Ember CLI application.

 It's goal is primarily to build all of the addons and app, and pass an array of trees along.
 */

class Assembler {
  constructor(options) {
    this.project = options.project;
    this.env = options.env;
    this.tests = options.tests;
    this.name = options.name;
    this.storeConfigInMeta = options.storeConfigInMeta;
    this.autoRun = options.autoRun;
    this.trees = options.trees;
    this.registry = options.registry;
    this._nodeModules = new Map();
    this.amdModuleNames = options.amdModuleNames;

    this._cachedConfigTree = null;
    this._cachedEmberCLITree = null;
    this._cachedTemplateTree = null;
    this._cachedFilterAppTree = null;
    this._cachedVendorTree = null;
    this._cachedBowerTree = null;
    this._cachedAddonTree = null;
    this._cachedNodeModuleTrees = null;
  }

  app() {
    let templates = this._processedTemplatesTree();

    let app = addonProcessTree(this.project, 'preprocessTree', 'js', mergeTrees([
      this._processedAppTree(),
      templates
    ], {
      annotation: 'TreeMerger (preprocessedApp & templates)',
      overwrite: true
    }));

    return preprocessJs(app, '/', this.name, {
      registry: this.registry
    });
  }

  assembleApp() {
    let app = this.app();
    let config = this.config();
    let external = this._processedExternalTree();

    // @TODO: why do we postprocess here?
    let postprocessedApp = addonProcessTree(this.project, 'postprocessTree', 'js', app);
    let emberCLITree = this._processedEmberCLITree();

    return [
      external,
      postprocessedApp,
      config,
      emberCLITree
    ];
  }

  /**
   @private
   @method _processedVendorTree
   @return
   */
  _processedVendorTree() {
    if (!this._cachedVendorTree) {
      let trees = this.addonTreesFor('vendor');

      if (this.trees.vendor) {
        trees.push(this.trees.vendor);
      }

      let mergedVendor = mergeTrees(trees, {
        overwrite: true,
        annotation: 'TreeMerger (vendor)',
      });

      this._cachedVendorTree = new Funnel(mergedVendor, {
        srcDir: '/',
        destDir: 'vendor/',
        annotation: 'Funnel (vendor)',
      });
    }

    return this._cachedVendorTree;
  }

  /**
   @private
   @method _processedBowerTree
   @return
   */
  _processedBowerTree() {
    let bowerDirectory = this.project.bowerDirectory;

    if (!this._cachedBowerTree) {
      // do not attempt to merge bower and vendor together
      // if they are the same tree
      if (bowerDirectory === 'vendor') {
        return;
      }

      // Don't blow up if there is no bower_components folder.
      if (!existsSync(bowerDirectory)) {
        return;
      }

      this._cachedBowerTree = new Funnel(this.trees.bower, {
        srcDir: '/',
        destDir: `${bowerDirectory}/`,
        annotation: 'Funnel (bower)',
      });
    }

    return this._cachedBowerTree;
  }

  _nodeModuleTrees() {
    if (!this._cachedNodeModuleTrees) {
      this._cachedNodeModuleTrees = Array.from(this._nodeModules.values(), module => new Funnel(module.path, {
        srcDir: '/',
        destDir: `node_modules/${module.name}/`,
        annotation: `Funnel (node_modules/${module.name})`,
      }));
    }

    return this._cachedNodeModuleTrees;
  }

  _addonTree() {
    if (!this._cachedAddonTree) {
      let addonTrees = this.addonTreesFor('addon');

      let combinedAddonTree = mergeTrees(addonTrees, {
        overwrite: true,
        annotation: 'TreeMerger: `addon/` trees'
      });

      this._cachedAddonTree = new Funnel(combinedAddonTree, {
        destDir: 'addon-tree-output',
        annotation: 'Funnel: addon-tree-output'
      });
    }

    return this._cachedAddonTree;
  }

  /**
   @private
   @method _processedExternalTree
   @return
   */
  _processedExternalTree() {
    if (!this._cachedExternalTree) {
      let vendor = this._processedVendorTree();
      let bower = this._processedBowerTree();
      let addons = this._addonTree();

      let trees = [vendor].concat(addons);
      if (bower) {
        trees.unshift(bower);
      }

      trees = this._nodeModuleTrees().concat(trees);

      let externalTree = mergeTrees(trees, {
        annotation: 'TreeMerger (ExternalTree)',
        overwrite: true,
      });

      if (this.amdModuleNames) {
        let anonymousAmd = new Funnel(externalTree, {
          files: Object.keys(this.amdModuleNames),
          annotation: 'Funnel (named AMD)',
        });
        externalTree = mergeTrees([externalTree, shimAmd(anonymousAmd, this.amdModuleNames)], {
          annotation: 'TreeMerger (named AMD)',
          overwrite: true,
        });
      }

      this._cachedExternalTree = externalTree;
    }

    return this._cachedExternalTree;
  }

  /**
   Filters styles and templates from the `app` tree.

   @private
   @method _filterAppTree
   @return {Tree}
   */
  _filterAppTree() {
    if (!this._cachedFilterAppTree) {
      let podPatterns = this._podTemplatePatterns();
      let excludePatterns = podPatterns.concat([
        // note: do not use path.sep here Funnel uses
        // walk-sync which always joins with `/` (not path.sep)
        'styles/**/*',
        'templates/**/*',
      ]);

      this._cachedFilterAppTree = new Funnel(this.trees.app, {
        exclude: excludePatterns,
        annotation: 'Funnel: Filtered App',
      });
    }

    return this._cachedFilterAppTree;
  }

  /**
   @private
   @method _processedAppTree
   @return
   */
  _processedAppTree() {
    let addonTrees = this.addonTreesFor('app');
    let mergedApp = mergeTrees(addonTrees.concat(this._filterAppTree()), {
      overwrite: true,
      annotation: 'TreeMerger (app)',
    });

    return new Funnel(mergedApp, {
      srcDir: '/',
      destDir: this.name,
      annotation: 'ProcessedAppTree',
    });
  }

  /**
   @private
   @method config
   @return
   */
  config() {
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

  _configReplacePatterns() {
    return [{
      match: /{{rootURL}}/g,
      replacement: calculateRootURL,
    }, {
      match: /{{EMBER_ENV}}/g,
      replacement: calculateEmberENV,
    }, {
      match: /{{content-for ['"](.+)["']}}/g,
      replacement: this.contentFor.bind(this),
    }, {
      match: /{{MODULE_PREFIX}}/g,
      replacement: calculateModulePrefix,
    }];
  }

  /**
    Returns a list of trees for a given type, returned by all addons.

    @private
    @method addonTreesFor
    @param  {String} type Type of tree
    @return {Array}       List of trees
   */
  addonTreesFor(type) {
    return this.project.addons.reduce((sum, addon) => {
      if (addon.treeFor) {
        let val = addon.treeFor(type);
        if (val) { sum.push(val); }
      }
      return sum;
    }, []);
  }

  _templatesTree() {
    if (!this._cachedTemplateTree) {
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
        trees.push(this.podTemplates());
      }

      this._cachedTemplateTree = mergeTrees(trees, {
        annotation: 'TreeMerge (templates)',
      });
    }

    return this._cachedTemplateTree;
  }

  /**
   @private
   @method _podTemplatePatterns
   @return {Array} An array of regular expressions.
   */
  _podTemplatePatterns() {
    return this.registry.extensionsForType('template')
      .map(extension => `**/*/template.${extension}`);
  }

  podTemplates() {
    return new Funnel(this.trees.app, {
      include: this._podTemplatePatterns(),
      exclude: ['templates/**/*'],
      destDir: `${this.name}/`,
      annotation: 'Funnel: Pod Templates',
    });
  }

  /**
    @private
    @method _processedTemplatesTree
    @return
  */
  _processedTemplatesTree() {
    let addonTrees = this.addonTreesFor('templates');
    let mergedTemplates = mergeTrees(addonTrees, {
      overwrite: true,
      annotation: 'TreeMerger (templates)',
    });

    let addonTemplates = new Funnel(mergedTemplates, {
      srcDir: '/',
      destDir: `${this.name}/templates`,
      annotation: 'ProcessedTemplateTree',
    });

    let combinedTemplates = mergeTrees([
      addonTemplates,
      this._templatesTree(),
    ], {
      annotation: 'addonPreprocessTree(template)',
      overwrite: true,
    });

    let templates = addonProcessTree(this.project, 'preprocessTree', 'template', combinedTemplates);

    // @TODO: move out
    return addonProcessTree(this.project, 'postprocessTree', 'template', preprocessTemplates(templates, {
      registry: this.registry,
      annotation: 'TreeMerger (pod & standard templates)',
    }));
  }

  /**
    @private
    @method _processedEmberCLITree
    @return
  */
  _processedEmberCLITree() {
    if (!this._cachedEmberCLITree) {
      let files = [
        'vendor-prefix.js',
        'vendor-suffix.js',
        'app-prefix.js',
        'app-suffix.js',
        'app-config.js',
        'app-boot.js',
        'test-support-prefix.js',
        'test-support-suffix.js',
        'tests-prefix.js',
        'tests-suffix.js',
      ];
      let emberCLITree = new ConfigReplace(new UnwatchedDir(__dirname), this.config(), {
        configPath: path.join(this.name, 'config', 'environments', `${this.env}.json`),
        files,

        patterns: this._configReplacePatterns(),
      });

      this._cachedEmberCLITree = new Funnel(emberCLITree, {
        files,
        srcDir: '/',
        destDir: '/vendor/ember-cli/',
        annotation: 'Funnel (ember-cli-tree)',
      });
    }

    return this._cachedEmberCLITree;
  }

  contentFor(config, match, type) {
    let content = [];
    let deprecatedHooks = ['app-prefix', 'app-suffix', 'vendor-prefix', 'vendor-suffix'];
    let deprecate = this.project.ui.writeDeprecateLine.bind(this.project.ui);

    // This normalizes `rootURL` to the value which we use everywhere inside of Ember CLI.
    // This makes sure that the user doesn't have to account for it in application code.
    if ('rootURL' in config) {
      config.rootURL = calculateRootURL(config);
    }

    switch (type) {
      case 'head': this._contentForHead(content, config); break;
      case 'config-module': this._contentForConfigModule(content, config); break;
      case 'app-boot': this._contentForAppBoot(content, config); break;
      case 'test-body-footer': this._contentForTestBodyFooter(content); break;
    }

    content = this.project.addons.reduce((content, addon) => {
      let addonContent = addon.contentFor ? addon.contentFor(type, config, content) : null;
      if (addonContent) {
        deprecate(`The \`${type}\` hook used in ${addon.name} is deprecated. The addon should generate a module and have consumers \`require\` it.`, deprecatedHooks.indexOf(type) === -1);
        return content.concat(addonContent);
      }

      return content;
    }, content);

    return content.join('\n');
  }

  _contentForTestBodyFooter(content) {
    content.push('<script>Ember.assert(\'The tests file was not loaded. Make sure your tests index.html includes "assets/tests.js".\', EmberENV.TESTS_FILE_LOADED);</script>');
  }

  _contentForHead(content, config) {
    content.push(calculateBaseTag(config));

    if (this.storeConfigInMeta) {
      content.push(`<meta name="${config.modulePrefix}/config/environment" content="${escape(JSON.stringify(config))}" />`);
    }
  }

  _contentForConfigModule(content, config) {
    if (this.storeConfigInMeta) {
      content.push(`var prefix = '${config.modulePrefix}';`);
      content.push(fs.readFileSync(path.join(__dirname, 'app-config-from-meta.js')));
    } else {
      content.push(`var exports = \{'default': ${JSON.stringify(config)}};` +
        `Object.defineProperty(exports, '__esModule', \{value: true});` +
        `return exports;`);
    }
  }

  _contentForAppBoot(content, config) {
    if (this.autoRun) {
      content.push('if (!runningTests) {');
      content.push(`  require("${config.modulePrefix}/app")["default"].create(${calculateAppConfig(config)});`);
      content.push('}');
    }
  }
}

module.exports = Assembler;
