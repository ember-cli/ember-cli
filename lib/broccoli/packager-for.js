'use strict';

const concat = require('broccoli-concat');
const mergeTrees = require('broccoli-merge-trees');

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
     'vendor/ember/jquery/jquery.js',
     'vendor/ember/ember.debug.js',
     'vendor/ember-cli-shims/app-shims.js',
     'vendor/loader/loader.js',
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

/*
  Concatenates both application and vendor javascript Broccoli trees into one, as follows:

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

  @method packagerFor
  @param {EmberApp} app
  @return {BroccoliTree} Final Broccoli Tree.
  */
module.exports = function packagerFor(app) {
  return function(inputTree) {
    let packagedAppTree = concat(inputTree, {
      inputFiles: [`${app.name}/**/*.js`],
      headerFiles: [
        'vendor/ember-cli/app-prefix.js',
      ],
      footerFiles: [
        'vendor/ember-cli/app-suffix.js',
        'vendor/ember-cli/app-config.js',
        'vendor/ember-cli/app-boot.js',
      ],
      outputFile: app.options.outputPaths.app.js,
      annotation: 'Concat App',
      sourceMapConfig: app.options.sourcemaps,
    });

    let importPaths = Object.keys(app._scriptOutputFiles);

    // iterate over the keys and create N strategies
    // to support scenarios like
    // app.import('vendor/foobar.js', { outputFile: 'assets/baz.js' });
    let packagedVendorTree = mergeTrees(importPaths.map(importPath => {
      let files = app._scriptOutputFiles[importPath];
      let isMainVendorFile = importPath === app.options.outputPaths.vendor.js;
      let vendorObject = getVendorFiles(files, isMainVendorFile);

      return concat(inputTree, {
        inputFiles: vendorObject.inputFiles,
        headerFiles: vendorObject.headerFiles,
        footerFiles: vendorObject.footerFiles,
        outputFile: importPath,
        annotation: 'Concat Vendor',
        sourceMapConfig: app.options.sourcemaps,
      });
    }));

    return mergeTrees([packagedAppTree, packagedVendorTree], {
      annotation: 'Concat (App & Vendor)',
    });
  };
};
