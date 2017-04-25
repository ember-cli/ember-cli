'use strict';

/**
@module ember-cli
*/
const defaultsDeep = require('ember-cli-lodash-subset').defaultsDeep;
const Funnel = require('broccoli-funnel');
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

    process.env.EMBER_ADDON_ENV = process.env.EMBER_ADDON_ENV || 'development';

    super(defaultsDeep(options, {
      name: 'dummy',
      configPath: './tests/dummy/config/environment',
      trees: {
        app: 'tests/dummy/app',
        styles: 'tests/dummy/app/styles',
        templates: 'tests/dummy/app/templates',
        public: 'tests/dummy/public',
        tests: new Funnel('tests', {
          exclude: [/^dummy/],
        }),
      },
      jshintrc: {
        tests: './tests',
        app: './tests/dummy',
      },
    }));
  }
}

module.exports = EmberAddon;
