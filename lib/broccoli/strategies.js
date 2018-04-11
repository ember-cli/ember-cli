'use strict';

const concat = require('broccoli-concat');

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
  constructor(options) {
    this.options = options;
  }

  toTree(assembler, inputTree) {
    return concat(inputTree, this.options);
  }
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

module.exports = {
  /*
    Concatenates all application's vendor javascript Broccoli trees into one, as follows:

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
      vendor.js
      vendor.map (if sourcemaps are enabled)
    ```

    @method createVendorJsStrategy
    @param {Object} options
    @return {Strategy} Concatenate Strategy (vendor).
   */
  createVendorJsStrategy(options) {
    const vendorObject = getVendorFiles(options.files, options.isMainVendorFile);

    return new ConcatenationStrategy({
      inputFiles: vendorObject.inputFiles,
      headerFiles: vendorObject.headerFiles,
      footerFiles: vendorObject.footerFiles,
      outputFile: options.outputFile,
      annotation: options.annotation,
      separator: '\n;',
      sourceMapConfig: options.sourceMapConfig,
    });
  },
};
