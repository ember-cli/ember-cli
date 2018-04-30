'use strict';

const p = require('ember-cli-preprocess-registry/preprocessors');
const path = require('path');
const concat = require('broccoli-concat');
const Funnel = require('broccoli-funnel');
const mergeTrees = require('./merge-trees');
const ConfigLoader = require('broccoli-config-loader');
const UnwatchedDir = require('broccoli-source').UnwatchedDir;
const ConfigReplace = require('broccoli-config-replace');
const emberAppUtils = require('../utilities/ember-app-utils');
const addonProcessTree = require('../utilities/addon-process-tree');

const preprocessCss = p.preprocessCss;
const preprocessJs = p.preprocessJs;
const preprocessTemplates = p.preprocessTemplates;

const DEFAULT_BOWER_PATH = 'bower_components';
const DEFAULT_VENDOR_PATH = 'vendor';
const EMBER_CLI_INTERNAL_FILES_PATH = '/vendor/ember-cli/';
const EMBER_CLI_FILES = [
  'app-boot.js',
  'app-config.js',
  'app-prefix.js',
  'app-suffix.js',
  'test-support-prefix.js',
  'test-support-suffix.js',
  'tests-prefix.js',
  'tests-suffix.js',
  'vendor-prefix.js',
  'vendor-suffix.js',
];

const configReplacePatterns = emberAppUtils.configReplacePatterns;

function callAddonsPreprocessTreeHook(project, type, tree) {
  return addonProcessTree(project, 'preprocessTree', type, tree);
}

function callAddonsPostprocessTreeHook(project, type, tree) {
  return addonProcessTree(project, 'postprocessTree', type, tree);
}

/*
  Creates an object with lists of files to be concatenated into `vendor.js` file.

  Given a map that looks like:

  ```
  {
    'assets/vendor.js': [
      'vendor/ember-cli-shims/app-shims.js',
      'vendor/loader/loader.js',
      'vendor/ember-resolver/legacy-shims.js',
      ...
    ]
  }
  ```

  Produces an object that looks like:

  ```
  {
    headerFiles: [
     'vendor/ember-cli/vendor-prefix.js',
     'vendor/loader/loader.js',
     'vendor/ember/jquery/jquery.js',
     'vendor/ember/ember.debug.js',
     'vendor/ember-cli-shims/app-shims.js',
     'vendor/ember-resolver/legacy-shims.js'
    ],
    inputFiles: [
      'addon-tree-output/**\/*.js'
    ],
    footerFiles: [
      'vendor/ember-cli/vendor-suffix.js'
    ],
    annotation: 'Vendor JS'
  }
  ```

  @private
  @method getVendorFiles
  @param {Object} files A list of files to include into `<file-name>.js`
  @param {Boolean} isMainVendorFile Boolean flag to indicate if we are dealing with `vendor.js` file
  @return {Object} An object with lists of files to be concatenated into `vendor.js` file.
 */
function getVendorFiles(files, isMainVendorFile) {
  return {
    headerFiles: files,
    inputFiles: isMainVendorFile ? ['addon-tree-output/**/*.js'] : [],
    footerFiles: isMainVendorFile ? ['vendor/ember-cli/vendor-suffix.js'] : [],
  };
}

/**
 * Responsible for packaging Ember.js application.
 *
 * @class DefaultPackager
 * @constructor
 */
module.exports = class DefaultPackager {
  constructor(options) {
    this._cachedTests = null;
    this._cachedBower = null;
    this._cachedVendor = null;
    this._cachedPublic = null;
    this._cachedConfig = null;
    this._cachedJavascript = null;
    this._cachedProcessedSrc = null;
    this._cachedProcessedTemplates = null;
    this._cachedProcessedJavascript = null;
    this._cachedEmberCliInternalTree = null;

    this.options = options || {};

    this.env = this.options.env;
    this.name = this.options.name;
    this.autoRun = this.options.autoRun;
    this.project = this.options.project;
    this.registry = this.options.registry;
    this.sourcemaps = this.options.sourcemaps;
    this.distPaths = this.options.distPaths;
    this.areTestsEnabled = this.options.areTestsEnabled;
    this.scriptOutputFiles = this.options.scriptOutputFiles;
    this.storeConfigInMeta = this.options.storeConfigInMeta;
    this.isModuleUnificationEnabled = this.options.isModuleUnificationEnabled;
  }

  /*
   * Returns a single tree with `ember-cli` internal files with the following
   * structure:
   *
   * ```
   * vendor/
   * └── ember-cli
   *     ├── app-boot.js
   *     ├── app-config.js
   *     ├── app-prefix.js
   *     ├── app-suffix.js
   *     ├── test-support-suffix.js
   *     ├── test-support-prefix.js
   *     ├── tests-prefix.js
   *     ├── tests-suffix.js
   *     ├── vendor-prefix.js
   *     └── vendor-suffix.js
   * ```
   *
   * Note, that the contents of these files is being matched against several
   * internal `ember-cli` variables, such as:
   *
   * + `{{MODULE_PREFIX}}`
   * + different types of `{{content-for}}` (`{{content-for 'app-boot'}}`)
   *
   * @private
   * @method packageEmberCliInternalFiles
   * @return {BroccoliTree}
  */
  packageEmberCliInternalFiles() {
    if (this._cachedEmberCliInternalTree === null) {
      let patterns = configReplacePatterns({
        addons: this.project.addons,
        autoRun: this.autoRun,
        storeConfigInMeta: this.storeConfigInMeta,
        isModuleUnification: this.isModuleUnificationEnabled,
      });

      let configTree = this.packageConfig(this.areTestsEnabled);
      let configPath = path.join(this.name, 'config', 'environments', `${this.env}.json`);

      let emberCLITree = new ConfigReplace(new UnwatchedDir(__dirname), configTree, {
        configPath,
        files: EMBER_CLI_FILES,
        patterns,
      });

      this._cachedEmberCliInternalTree = new Funnel(emberCLITree, {
        files: EMBER_CLI_FILES,
        destDir: EMBER_CLI_INTERNAL_FILES_PATH,
        annotation: 'Packaged Ember CLI Internal Files',
      });
    }

    return this._cachedEmberCliInternalTree;
  }

  /*
   * Runs pre/post-processors hooks on the template files and returns a single
   * tree with the processed templates.
   *
   * Given a tree:
   *
   * ```
   * the-best-app-ever/
   * └── templates
   *     ├── application.hbs
   *     ├── error.hbs
   *     ├── index.hbs
   *     └── loading.hbs
   * ```
   *
   * Returns:
   *
   * ```
   * the-best-app-ever/
   * └── templates
   *     ├── application.js
   *     ├── error.js
   *     ├── index.js
   *     └── loading.js
   * ```
   *
   * @private
   * @method processTemplates
   * @param {BroccoliTree} tree
   * @return {BroccoliTree}
  */
  processTemplates(templates) {
    if (this._cachedProcessedTemplates === null) {
      let options = {
        registry: this.registry,
      };
      let preprocessedTemplatesFromAddons = callAddonsPreprocessTreeHook(this.project, 'template', templates);

      this._cachedProcessedTemplates = callAddonsPostprocessTreeHook(
        this.project,
        'template',
        preprocessTemplates(preprocessedTemplatesFromAddons, options)
      );
    }

    return this._cachedProcessedTemplates;
  }

  /*
   * Runs pre/post-processors hooks on the javascript files and returns a single
   * tree with the processed javascript.
   *
   * Given a tree:
   *
   * ```
   * the-best-app-ever/
   * ├── adapters
   * │   └── application.js
   * ├── app.js
   * ├── components
   * ├── controllers
   * ├── helpers
   * │   ├── and.js
   * │   ├── app-version.js
   * │   ├── await.js
   * │   ├── camelize.js
   * │   ├── cancel-all.js
   * │   ├── dasherize.js
   * │   ├── dec.js
   * │   ├── drop.js
   * │   └── eq.js
   * ...
   * ```
   *
   * Returns the tree with the same structure, but with processed files.
   *
   * @private
   * @method processJavascript
   * @param {BroccoliTree} tree
   * @return {BroccoliTree}
  */
  processJavascript(tree) {
    if (this._cachedProcessedJavascript === null) {
      let app = callAddonsPreprocessTreeHook(this.project, 'js', tree);

      let preprocessedApp = preprocessJs(app, '/', this.name, {
        registry: this.registry,
      });

      this._cachedProcessedJavascript = callAddonsPostprocessTreeHook(this.project, 'js', preprocessedApp);
    }

    return this._cachedProcessedJavascript;
  }

  /*
   * Runs pre/post-processors hooks on the application files (javascript,
   * styles, templates) and returns a single tree with the processed ones.
   *
   * Used only when `MODULE_UNIFICATION` experiment is enabled.
   *
   * Given a tree:
   *
   * ```
   * /
   * └── src
   *     ├── main.js
   *     ├── resolver.js
   *     ├── router.js
   *     └── ui
   *         ├── components
   *         ├── index.html
   *         ├── routes
   *         │   └── application
   *         │   └── template.hbs
   *         └── styles
   *             └── app.css
   * ```
   *
   * Returns the tree with the same structure, but with processed files.
   *
   * @private
   * @method processSrc
   * @param {BroccoliTree} tree
   * @return {BroccoliTree}
  */
  processSrc(tree) {
    if (this._cachedProcessedSrc === null && tree !== null) {
      let srcAfterPreprocessTreeHook = callAddonsPreprocessTreeHook(this.project, 'src', tree);

      let options = {
        outputPaths: this.distPaths.appCssFile,
        registry: this.registry,
      };

      // TODO: This isn't quite correct (but it does function properly in most cases),
      // and should be re-evaluated before enabling the `MODULE_UNIFICATION` feature
      this._srcAfterStylePreprocessing = preprocessCss(srcAfterPreprocessTreeHook, '/src/ui/styles', '/assets', options);

      let srcAfterTemplatePreprocessing = preprocessTemplates(srcAfterPreprocessTreeHook, {
        registry: this.registry,
        annotation: 'Process Templates: src',
      });

      let srcAfterPostprocessTreeHook = callAddonsPostprocessTreeHook(this.project, 'src', srcAfterTemplatePreprocessing);

      return new Funnel(srcAfterPostprocessTreeHook, {
        srcDir: '/',
        destDir: `${this.name}`,
        annotation: 'Funnel: src',
      });
    }

    return this._cachedProcessedSrc;
  }

  /*
   * Given an input tree, returns a properly assembled Broccoli tree with bower
   * components.
   *
   * Given a tree:
   *
   * ```
   * ├── ember.js/
   * ├── pusher/
   * └── raven-js/
   * ```
   *
   * Returns:
   *
   * ```
   * [bowerDirectory]/
   * ├── ember.js/
   * ├── pusher/
   * └── raven-js/
   * ```
   *
   * @private
   * @method packageBower
   * @param {BroccoliTree} tree
   * @param {String} bowerDirectory Custom path to bower components
  */
  packageBower(tree, bowerDirectory) {
    if (this._cachedBower === null) {
      this._cachedBower = new Funnel(tree, {
        destDir: bowerDirectory || DEFAULT_BOWER_PATH,
        annotation: 'Packaged Bower',
      });
    }

    return this._cachedBower;
  }

  /*
   * Given an input tree, returns a properly assembled Broccoli tree with vendor
   * files.
   *
   * Given a tree:
   *
   * ```
   * ├── babel-polyfill/
   * ├── ember-cli-shims/
   * ├── ember-load-initializers/
   * ├── ember-qunit/
   * ├── ember-resolver/
   * ├── sinon/
   * └── tether/
   * ```
   *
   * Returns:
   *
   * ```
   * vendor/
   * ├── babel-polyfill/
   * ├── ember-cli-shims/
   * ├── ember-load-initializers/
   * ├── ember-qunit/
   * ├── ember-resolver/
   * ├── sinon/
   * └── tether/
   * ```
   *
   * @private
   * @method packageVendor
   * @param {BroccoliTree} tree
  */
  packageVendor(tree) {
    if (this._cachedVendor === null) {
      this._cachedVendor = new Funnel(tree, {
        destDir: DEFAULT_VENDOR_PATH,
        annotation: 'Packaged Vendor',
      });
    }

    return this._cachedVendor;
  }

  /*
   * Given an input tree, returns a properly assembled Broccoli tree with tests
   * files.
   *
   * Given a tree:
   *
   * ```
   * ├── acceptance/
   * ├── helpers/
   * ├── index.html
   * ├── integration/
   * ├── test-helper.js
   * └── unit/
   * ```
   *
   * Returns:
   *
   * ```
   * [name]/
   * └── tests
   *     ├── acceptance/
   *     ├── helpers/
   *     ├── index.html
   *     ├── integration/
   *     ├── test-helper.js
   *     └── unit/
   * ```
   *
   * @private
   * @method packageTests
   * @param {BroccoliTree} tree
  */
  packageTests(tree) {
    if (this._cachedTests === null) {
      tree = addonProcessTree(this.project, 'preprocessTree', 'test', tree);

      tree = new Funnel(tree, {
        destDir: `${this.name}/tests`,
        annotation: 'Packaged Tests',
      });

      let preprocessedTests = preprocessJs(tree, '/tests', this.name, {
        registry: this.registry,
      });

      this._cachedTests = addonProcessTree(this.project, 'postprocessTree', 'test', preprocessedTests);
    }

    return this._cachedTests;
  }

  /*
   * Given input trees (both application and add-ons), merges them into one.
   *
   * Given a tree:
   *
   * ```
   * ├── 500.html
   * ├── images
   * ├── maintenance.html
   * └── robots.txt
   * ```
   *
   * And add-on tree:
   *
   * ```
   * ember-fetch/
   * └── fastboot-fetch.js
   * ```
   *
   * Returns:
   *
   * ```
   * ├── 500.html
   * ├── ember-fetch
   * │   └── fastboot-fetch.js
   * ├── images
   * ├── maintenance.html
   * └── robots.txt
   * ```
   *
   * @private
   * @method packagePublic
   * @param {Array<BroccoliTree>} trees
  */
  packagePublic(trees) {
    if (this._cachedPublic === null) {
      this._cachedPublic = mergeTrees(trees, {
        overwrite: true,
        annotation: 'Packaged Public',
      });
    }

    return this._cachedPublic;
  }

  /*
   * Given an input tree, returns a properly assembled Broccoli tree with
   * configuration files.
   *
   * Given a tree:
   *
   * ```
   * environments/
   * ├── development.json
   * └── test.json
   * ```
   *
   * Returns:
   *
   * ```
   * └── [name]
   *     └── config
   *         └── environments
   *             ├── development.json
   *             └── test.json
   * ```
   * @private
   * @method packageConfig
   * @param {Boolean} testsEnabled Boolean flag to control the inclusion of
   *                  `test.json` file in the resulting tree.
  */
  packageConfig(testsEnabled) {
    let env = this.env;
    let name = this.name;
    let project = this.project;
    let configPath = this.project.configPath();

    if (this._cachedConfig === null) {
      let configTree = new ConfigLoader(path.dirname(configPath), {
        env,
        tests: testsEnabled || false,
        project,
      });

      this._cachedConfig = new Funnel(configTree, {
        destDir: `${name}/config`,
        annotation: 'Packaged Config',
      });
    }

    return this._cachedConfig;
  }

  /*
   * Concatenates all javascript Broccoli trees into one, as follows:
   *
   * Given an input tree that looks like:
   *
   * ```
   * addon-tree-output/
   *   ember-ajax/
   *   ember-data/
   *   ember-engines/
   *   ember-resolver/
   *   ...
   * bower_components/
   *   usertiming/
   *   sinonjs/
   *   ...
   * the-best-app-ever/
   *   components/
   *   config/
   *   helpers/
   *   routes/
   *   ...
   * vendor/
   *   ...
   *   babel-core/
   *   ...
   *   broccoli-concat/
   *   ...
   *   ember-cli-template-lint/
   *   ...
   * ```
   *
   * Returns:
   *
   * ```
   * assets/
   *   the-best-app-ever.js
   *   the-best-app-ever.map (if sourcemaps are enabled)
   *   vendor.js
   *   vendor.map (if sourcemaps are enabled)
   * ```
   *
   * @private
   * @method packageJavascript
   * @return {BroccoliTree}
  */
  packageJavascript(tree) {
    if (this._cachedJavascript === null) {
      let vendorFilePath = this.distPaths.vendorJsFile;
      this.scriptOutputFiles[vendorFilePath].unshift('vendor/ember-cli/vendor-prefix.js');

      let appJs = this.packageApplicationJs(tree);
      let vendorJs = this.packageVendorJs(tree);

      this._cachedJavascript = mergeTrees([appJs, vendorJs], {
        overwrite: true,
        annotation: 'Packaged Javascript',
      });
    }

    return this._cachedJavascript;
  }

  /*
   * Concatenates all application's javascript Broccoli trees into one, as follows:
   *
   * Given an input tree that looks like:
   *
   * ```
   * addon-tree-output/
   *   ember-ajax/
   *   ember-data/
   *   ember-engines/
   *   ember-resolver/
   *   ...
   * bower_components/
   *   usertiming/
   *   sinonjs/
   *   ...
   * the-best-app-ever/
   *   components/
   *   config/
   *   helpers/
   *   routes/
   *   ...
   * vendor/
   *   ...
   *   babel-core/
   *   ...
   *   broccoli-concat/
   *   ...
   *   ember-cli-template-lint/
   *   ...
   * ```
   *
   * Returns:
   *
   * ```
   * assets/
   *   the-best-app-ever.js
   *   the-best-app-ever.map (if sourcemaps are enabled)
   * ```
   *
   * @private
   * @method packageApplicationJs
   * @return {BroccoliTree}
  */
  packageApplicationJs(tree) {
    let inputFiles = [`${this.name}/**/*.js`];
    let headerFiles = [
      'vendor/ember-cli/app-prefix.js',
    ];
    let footerFiles = [
      'vendor/ember-cli/app-suffix.js',
      'vendor/ember-cli/app-config.js',
      'vendor/ember-cli/app-boot.js',
    ];

    return concat(tree, {
      inputFiles,
      headerFiles,
      footerFiles,
      outputFile: this.distPaths.appJsFile,
      annotation: 'Packaged Application Javascript',
      separator: '\n;',
      sourceMapConfig: this.sourcemaps,
    });
  }

  /*
   * Concatenates all application's vendor javascript Broccoli trees into one, as follows:
   *
   * Given an input tree that looks like:
   * ```
   * addon-tree-output/
   *   ember-ajax/
   *   ember-data/
   *   ember-engines/
   *   ember-resolver/
   *   ...
   * bower_components/
   *   usertiming/
   *   sinonjs/
   *   ...
   * the-best-app-ever/
   *   components/
   *   config/
   *   helpers/
   *   routes/
   *   ...
   * vendor/
   *   ...
   *   babel-core/
   *   ...
   *   broccoli-concat/
   *   ...
   *   ember-cli-template-lint/
   *   ...
   * ```
   *
   * Returns:
   *
   * ```
   * assets/
   *   vendor.js
   *   vendor.map (if sourcemaps are enabled)
   * ```
   *
   * @method packageVendorJs
   * @param {BroccoliTree} tree
   * @return {BroccoliTree}
  */
  packageVendorJs(tree) {
    let importPaths = Object.keys(this.scriptOutputFiles);

    // iterate over the keys and concat files
    // to support scenarios like
    // app.import('vendor/foobar.js', { outputFile: 'assets/baz.js' });
    let vendorTrees = importPaths.map(importPath => {
      let files = this.scriptOutputFiles[importPath];
      let isMainVendorFile = importPath === this.distPaths.vendorJsFile;

      const vendorObject = getVendorFiles(files, isMainVendorFile);

      return concat(tree, {
        inputFiles: vendorObject.inputFiles,
        headerFiles: vendorObject.headerFiles,
        footerFiles: vendorObject.footerFiles,
        outputFile: importPath,
        annotation: `Package ${importPath}`,
        separator: '\n;',
        sourceMapConfig: this.sourcemaps,
      });
    });

    return mergeTrees(vendorTrees, {
      overwrite: true,
      annotation: 'Packaged Vendor Javascript',
    });
  }
};
