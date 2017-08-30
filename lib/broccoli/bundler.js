'use strict';

const concat = require('broccoli-concat');
const BroccoliDebug = require('broccoli-debug');
const Assembler = require('broccoli-assembler');

/**
  Concatenation strategy.

  Given an input tree and concat options, returns a tree.

  @class ConcatenationStrategy
  @constructor
  @param {BroccoliTree} An input broccoli tree
  @param {Object} Configuration options for `broccoli-concat`
  @return {BroccoliTree} Transformed broccoli tree
 */
class ConcatenationStrategy {
  constructor(tree, options) {
    this.tree = tree;
    this.options = options;
  }

  toTree(assembler, inputTree) {
    return concat(inputTree, this.options);
  }
}

module.exports = class Bundler {
  /*
    Responsibility of this class is to intelligently produce
    the final output given a list of trees that were passed in.

    @class Bundler
    @constructor
    @param {Object} Configuration options
   */
  constructor(options) {
    this.name = options.name;
    this.sourcemaps = options.sourcemaps;
    this.appOutputPath = options.appOutputPath;
    this.vendorFilePath = options.vendorFilePath;
    this.isBabelAvailable = options.isBabelAvailable;
    this._debugTree = BroccoliDebug.buildDebugCallback('bundler');
  }

  /*
    Creates an object with lists of files to be concatenated into `vendor.js` file.

    Given a map that looks like:

    {
      'assets/vendor.js': [
        'vendor/ember-cli-shims/app-shims.js',
        'vendor/loader/loader.js',
        'vendor/ember-resolver/legacy-shims.js',
        ...
      ]
    }

    Produces an object that looks like:

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

    @private
    @method getVendorFiles
    @param {Object} scriptOutputFiles A map with a key as a file name and list of files to include into `<file-name>.js`
    @return {Array} An object with lists of files to be concatenated into `vendor.js` file.
   */
  getVendorFiles(scriptOutputFiles) {
    let vendorObject = {
      headerFiles: [],
      inputFiles: [],
      footerFiles: [],
      annotation: 'Vendor JS',
    };

    for (let outputFile in scriptOutputFiles) {
      let isMainVendorFile = outputFile === this.vendorFilePath;
      let headerFiles = scriptOutputFiles[outputFile];
      let inputFiles = isMainVendorFile ? ['addon-tree-output/**/*.js'] : [];
      let footerFiles = isMainVendorFile ? ['vendor/ember-cli/vendor-suffix.js'] : [];

      vendorObject.headerFiles = vendorObject.headerFiles.concat(headerFiles);
      vendorObject.inputFiles = vendorObject.inputFiles.concat(inputFiles);
      vendorObject.footerFiles = vendorObject.footerFiles.concat(footerFiles);
    }

    return vendorObject;
  }

  /*
    Concatenates all javascript Broccoli trees into one, as follows:

    Given an input tree that looks like:

    ```
    addon-tree-output/
      ember-ajax/
      ember-data/
      ember-engines/
      ember-resolver/
      ...
    bower_components/
      usertiming/
      sinonjs/
      ...
    the-best-app-ever/
      components/
      config/
      helpers/
      routes/
      ...
    vendor/
      ...
      babel-core/
      ...
      broccoli-concat/
      ...
      ember-cli-template-lint/
      ...
    ```

    Produces a tree that looks like:

    ```
    assets/
      the-best-app-ever.js
      the-best-app-ever.map (if sourcemaps are enabled)
      vendor.js
      vendor.map (if sourcemaps are enabled)
    ```

    @method bundleAppJs
    @param {Tree} applicationAndDepsTree Broccoli tree with application and dependencies
    @return {Tree} Concatenated tree (application and dependencies).
   */
  bundleJs(applicationAndDepsTree, options) {
    options = options || {};

    let scriptOutputFiles = options.scriptOutputFiles;
    let applicationAndDepsDebugTree = this._debugTree(applicationAndDepsTree, 'js:input');

    let appJsConcat = new ConcatenationStrategy(applicationAndDepsDebugTree, {
      inputFiles: [`${this.name}/**/*.js`],
      headerFiles: [
        'vendor/ember-cli/app-prefix.js',
      ],
      footerFiles: [
        'vendor/ember-cli/app-suffix.js',
        'vendor/ember-cli/app-config.js',
        'vendor/ember-cli/app-boot.js',
      ],
      outputFile: this.appOutputPath,
      annotation: 'Concat: App',
      sourceMapConfig: this.sourcemaps,
    });
    let vendorObject = this.getVendorFiles(scriptOutputFiles);
    let vendorJsConcat = new ConcatenationStrategy(applicationAndDepsDebugTree, {
      inputFiles: vendorObject.inputFiles,
      headerFiles: vendorObject.headerFiles,
      footerFiles: vendorObject.footerFiles,
      outputFile: this.vendorFilePath,
      annotation: vendorObject.annotation,
      sourceMapConfig: this.sourcemaps,
    });

    let combinedTree = new Assembler(applicationAndDepsDebugTree, {
      strategies: [appJsConcat, vendorJsConcat],
      annotation: 'Assembler (vendor & appJS)',
    });

    return this._debugTree(combinedTree.toTree(), 'js:output');
  }
};
