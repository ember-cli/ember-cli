'use strict';

/**
@module ember-cli
*/
const defaultsDeep = require('ember-cli-lodash-subset').defaultsDeep;
const WatchedDir = require('broccoli-source').WatchedDir;
const UnwatchedDir = require('broccoli-source').UnwatchedDir;
const Funnel = require('broccoli-funnel');
const existsSync = require('exists-sync');
const path = require('path');

const experiments = require('../experiments');
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

    let project = defaults.project;

    function _resolveLocal(to) {
      return path.join(project.root, to);
    }

    process.env.EMBER_ADDON_ENV = process.env.EMBER_ADDON_ENV || 'development';

    let srcPath = _resolveLocal('tests/dummy/src');
    let srcTree = existsSync(srcPath) ? new WatchedDir(srcPath) : null;

    let appPath = _resolveLocal('tests/dummy/app');
    let appTree;
    if (experiments.MODULE_UNIFICATION) {
      appTree = existsSync(appPath) ? new WatchedDir(appPath) : null;
    } else {
      appTree = new WatchedDir(appPath);
    }

    let testsPath = _resolveLocal('tests');
    let testsTree = existsSync(testsPath) ? new WatchedDir(testsPath) : null;

    // these are contained within app/ no need to watch again
    // (we should probably have the builder or the watcher dedup though)
    let stylesPath;

    if (experiments.MODULE_UNIFICATION) {
      let srcStylesPath = _resolveLocal('tests/dummy/src/ui/styles');
      stylesPath = existsSync(srcStylesPath) ? srcStylesPath : _resolveLocal('tests/dummy/app/styles');
    } else {
      stylesPath = _resolveLocal('tests/dummy/app/styles');
    }
    let stylesTree = new UnwatchedDir(stylesPath);

    let templatesPath = _resolveLocal('tests/dummy/app/templates');
    let templatesTree = existsSync(templatesPath) ? new UnwatchedDir(templatesPath) : null;

    let publicPath = _resolveLocal('tests/dummy/public');
    let publicTree = existsSync(publicPath) ? new WatchedDir(publicPath) : null;

    super(defaultsDeep(options, {
      name: 'dummy',
      configPath: './tests/dummy/config/environment',
      trees: {
        app: appTree,
        src: srcTree,
        styles: stylesTree,
        templates: templatesTree,
        public: publicTree,
        tests: new Funnel(testsTree, {
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
