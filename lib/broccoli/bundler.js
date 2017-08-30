'use strict';

const concat = require('broccoli-concat');
const mergeTrees = require('./merge-trees');
const BroccoliDebug = require('broccoli-debug');

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
    Creates an array of Broccoli concatenates trees to be included into `vendor.js` file.

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

    And a map that looks like:

    {
      'assets/vendor.js': [
        'vendor/ember-cli-shims/app-shims.js',
        'vendor/loader/loader.js',
        'vendor/ember-resolver/legacy-shims.js',
        ...
      ]
    }

    Produces an array of Broccoli trees to be included into `vendor.js`.

    @private
    @method getVendorFiles
    @param {Tree} applicationAndDepsTree Broccoli tree with application and dependencies
    @param {Object} scriptOutputFiles A map with a key as a file name and list of files to include into `<file-name>.js`
    @return {Array} Array of trees to be included into resulting `vendor.js` file.
   */
  getVendorFiles(applicationAndDepsTree, scriptOutputFiles) {
    let vendorFiles = [];

    for (let outputFile in scriptOutputFiles) {
      let isMainVendorFile = outputFile === this.vendorFilePath;
      let headerFiles = scriptOutputFiles[outputFile];
      let inputFiles = isMainVendorFile ? ['addon-tree-output/**/*.js'] : [];
      let footerFiles = isMainVendorFile ? ['vendor/ember-cli/vendor-suffix.js'] : [];

      vendorFiles.push(
        concat(applicationAndDepsTree, {
          headerFiles,
          inputFiles,
          footerFiles,
          outputFile,
          allowNone: true,
          separator: '\n;',
          annotation: `Concat: Vendor ${outputFile}`,
          sourceMapConfig: this.sourcemaps,
        })
      );
    }

    return vendorFiles;
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

    let appJs = concat(applicationAndDepsDebugTree, {
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

    let vendorFiles = this.getVendorFiles(applicationAndDepsDebugTree, scriptOutputFiles);

    let combinedTree = mergeTrees(vendorFiles.concat(appJs), {
      annotation: 'TreeMerger (vendor & appJS)',
    });

    return this._debugTree(combinedTree, 'js:output');
  }
};
