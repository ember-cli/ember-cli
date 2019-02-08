'use strict';

/**
@module ember-cli
*/
const defaultsDeep = require('ember-cli-lodash-subset').defaultsDeep;
const Funnel = require('broccoli-funnel');
const fs = require('fs');

const EmberApp = require('./ember-app');

class EmberAddon extends EmberApp {
  /**
    EmberAddon is used during addon development.

    @class EmberAddon
    @extends EmberApp
    @constructor
    @param {Object} [defaults]
    @param {Object} [options={}] Configuration options
  */
  constructor(defaults, options) {
    if (arguments.length === 0) {
      options = {};
    } else if (arguments.length === 1) {
      options = defaults;
    } else {
      defaultsDeep(options, defaults);
    }

    // Let's use first an ENV variable until there is a feature agreement
    let name = process.env.EMBER_CLI_DUMMY = process.env.EMBER_CLI_DUMMY || 'dummy';
    process.env.EMBER_ADDON_ENV = process.env.EMBER_ADDON_ENV || 'development';

    let testsExclude = [new RegExp(`^${name}`)];

    let overrides = {
      name,
      configPath: `./tests/${name}/config/environment`,
      trees: {
        app: `tests/${name}/app`,
        public: `tests/${name}/public`,
        src: null,
        styles: `tests/${name}/app/styles`,
        templates: `tests/${name}/app/templates`,
        tests: new Funnel('tests', {
          exclude: testsExclude,
        }),
        vendor: null,
      },
      jshintrc: {
        tests: './tests',
        app: `./tests/${name}`,
      },
      // outputPaths can be changed  to use `name` when tests/index.html support dynamic assets
      outputPaths: {
        app: {
          css: {
            app: `/assets/dummy.css`,
          },
          js: `/assets/dummy.js`,
        },
      },
    };


    if (!fs.existsSync(`tests/${name}/app`)) {
      overrides.trees.app = null;
      overrides.trees.styles = null;
      overrides.trees.templates = null;
    }
    if (fs.existsSync(`tests/${name}/src`)) {
      overrides.trees.src = `tests/${name}/src`;
      overrides.trees.styles = `tests/${name}/src/ui/styles`;
    }

    if (fs.existsSync(`tests/${name}/vendor`)) {
      overrides.trees.vendor = `tests/${name}/vendor`;
    }

    super(defaultsDeep(options, overrides));
  }
}

module.exports = EmberAddon;
