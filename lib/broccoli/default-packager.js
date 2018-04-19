'use strict';

const p = require('ember-cli-preprocess-registry/preprocessors');
const path = require('path');
const concat = require('broccoli-concat');
const Funnel = require('broccoli-funnel');
const mergeTrees = require('./merge-trees');
const ConfigLoader = require('broccoli-config-loader');
const addonProcessTree = require('../utilities/addon-process-tree');

const preprocessJs = p.preprocessJs;
const preprocessCss = p.preprocessCss;
const preprocessTemplates = p.preprocessTemplates;
const preprocessMinifyCss = p.preprocessMinifyCss;

const DEFAULT_BOWER_PATH = 'bower_components';
const DEFAULT_VENDOR_PATH = 'vendor';

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
      'addon-modules/**\/*.js'
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
    inputFiles: isMainVendorFile ? ['addon-modules/**/*.js'] : [],
    footerFiles: isMainVendorFile ? ['vendor/ember-cli/vendor-suffix.js'] : [],
  };
}

function addonPreprocessTree(project, type, tree) {
  return addonProcessTree(project, 'preprocessTree', type, tree);
}

function addonPostprocessTree(project, type, tree) {
  return addonProcessTree(project, 'postprocessTree', type, tree);
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

    this.options = options || {};

    this.env = this.options.env;
    this.name = this.options.name;
    this.project = this.options.project;
    this.registry = this.options.registry;
    this.sourcemaps = this.options.sourcemaps;
    this.distPaths = this.options.distPaths;
    this.areTestsEnabled = this.options.areTestsEnabled;
    this.styleOutputFiles = this.options.styleOutputFiles;
    this.scriptOutputFiles = this.options.scriptOutputFiles;
  }

  compileTemplates(templates) {
    let preprocessed = addonPreprocessTree('template', templates);

    return addonPostprocessTree('template', preprocessTemplates(preprocessed, {
      registry: this.registry,
      annotation: 'Compile Templates',
    }));
  }

  compileJavascript(javascript) {
    let preprocessed = addonPreprocessTree('js', javascript);

    return this.addonPostprocessTree('js', preprocessJs(preprocessed, '/', this.name, {
      registry: this.registry,
      annotation: 'Compile Javascript',
    }));
  }

  compileStyles(tree) {
    let cssMinificationEnabled = this.minify.css.enabled;
    let options = {
      outputPaths: this.distPaths.appCssFile,
      registry: this.registry,
      minifyCSS: this.minify.css.options,
    };

    let stylesAndVendor = addonPreprocessTree('css', tree);

    let preprocessedStyles = preprocessCss(stylesAndVendor, '/app/styles', '/assets', options);

    let vendorStyles = this.packageStyles(stylesAndVendor);

    vendorStyles = addonPreprocessTree('css', vendorStyles);

    if (cssMinificationEnabled === true) {
      preprocessedStyles = preprocessMinifyCss(preprocessedStyles, options);
      vendorStyles = preprocessMinifyCss(vendorStyles, options);
    }

    return mergeTrees([
      preprocessedStyles,
      vendorStyles,
    ], {
      annotation: 'Compile Styles',
    });
  }

  /*
  package(options) {
    let app = options.app.main;
    let index = options.index;
    let external = options.app.external;
    let src = this.packageSrc(options.app.src);
    let emberCLI = options.app.cli;
    let templates = this.compileTemplates(options.app.templates);
    let config = this.packageConfig();
    let styles = options.styles;
    let other = options.other;
    let publicT = options.public;
    let tests = options.tests;

    let packagedApp = this.compileJavascript(mergeTrees([
      app,
      src,
      templates,
    ], {
      overwrite: true,
      annotation: 'Merged Javascript',
    ));

    let appJs = this.packageJavascript(mergeTrees([
      external,
      packagedApp,
      config,
      emberCLI,
    ], {
      overwrite: true,
    }));
    let appStyles = this.compileStyles(styles);

    return [
      index,
      appJs,
      appStyles,
      // undefined when `experiments.MODULE_UNIFICATION` is not available
      // this._srcAfterStylePreprocessing,
      other,
      publicT,
      tests,
    ].filter(Boolean);
  }
  */

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
  */
  packageConfig() {
    let env = this.env;
    let name = this.name;
    let project = this.project;
    let configPath = this.project.configPath();
    let testsEnabled = this.areTestsEnabled;

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
   * addon-modules/
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
   * addon-modules/
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
   * addon-modules/
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

    // iterate over the keys and create N strategies
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

  packageStyles(tree) {
    let vendorStyles = [];

    for (let outputFile in this.styleOutputFiles) {
      let isMainVendorFile = outputFile === this.distPaths.vendorCssFile;
      let headerFiles = this.styleOutputFiles[outputFile];
      let inputFiles = isMainVendorFile ? ['addon-modules/**/*.css'] : [];

      console.log('input', inputFiles);
      console.log('header', headerFiles);

      vendorStyles.push(concat(tree, {
        headerFiles,
        inputFiles,
        outputFile,
        allowNone: true,
        sourceMapConfig: this.sourcemaps,
        annotation: `Package ${outputFile}`,
      }));
    }

    return mergeTrees(vendorStyles, {
      overwrite: true,
      annotation: 'Packaged Styles',
    });
  }
};
