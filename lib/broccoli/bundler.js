'use strict';

const concat = require('broccoli-concat');
const processModulesOnly = require('./babel-process-modules-only');

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
    this.isBabelAvailable = options.isBabelAvailable;
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
    ```

    @method bundleAppJs
    @return {Tree} Concatenated tree (application and dependencies).
   */
  bundleJs(applicationAndDepsTree, options) {
    options = options || {};

    let appJs = concat(applicationAndDepsTree, {
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
      annotation: options.appTreeAnnotation,
      sourceMapConfig: this.sourcemaps,
    });

    if (!this.isBabelAvailable) {
      appJs = processModulesOnly(appJs, 'Babel: Modules for app/');
    }

    return appJs;
  }
};
