'use strict';

const path = require('path');
const fs = require('fs-extra');
const merge = require('ember-cli-lodash-subset').merge;
const FixturifyProject = require('fixturify-project');
const Project = require('../../lib/models/project');
const MockCLI = require('./mock-cli');

// used in these tests to ensure we are only
// operating on the addons added here
class ProjectWithoutInternalAddons extends Project {
  supportedInternalAddonPaths() {
    return [];
  }
}

function prepareAddon(addon, options) {
  addon.pkg.keywords.push('ember-addon');
  addon.pkg['ember-addon'] = {};
  addon.files['index.js'] = `module.exports = {
    name: require("./package").name,
    allowCachingPerBundle: ${Boolean(options.allowCachingPerBundle)},
    ${options.additionalContent || ''}
  };`;
}

/**
 * Gets a normalized object with provided defaults. If the 2nd argument is a function,
 * we add this to the returned object with `callback` as its key.
 *
 * @name getOptionsObjectWithCallbackFunction
 * @param {Object} defaultOptions The default options
 * @param {Object|Function} optionsOrCallback The options object or callback function
 * @returns {Object} The normalized options object
 */
function getOptionsObjectWithCallbackFunction(defaultOptions, optionsOrCallback) {
  return Object.assign(
    {},
    defaultOptions,
    typeof optionsOrCallback === 'function' ? { callback: optionsOrCallback } : optionsOrCallback
  );
}

module.exports = class EmberCLIFixturifyProject extends FixturifyProject {
  // we can't do this in the constructor since we need access to this as part of
  // `super`; we create the `Set` as necessary upon first access, and subsequently
  // we just return the previously created `Set`
  get _inRepoAddonsWithSharedDependencies() {
    if (!this.__inRepoAddonsWithSharedDependencies) {
      this.__inRepoAddonsWithSharedDependencies = new Set();
    }

    return this.__inRepoAddonsWithSharedDependencies;
  }

  // same reason as above, we can't do this in the constructor since we need access
  // to this as part of `super`
  get _addonsWithSharedDependencies() {
    if (!this.__addonsWithSharedDependencies) {
      this.__addonsWithSharedDependencies = new Set();
    }

    return this.__addonsWithSharedDependencies;
  }

  writeSync() {
    super.writeSync(...arguments);

    // remove in-repo addons `node_modules` that should be hoisted
    for (const name of this._inRepoAddonsWithSharedDependencies) {
      const pathToAddonNodeModules = path.join(this.baseDir, 'lib', name, 'node_modules');
      fs.removeSync(pathToAddonNodeModules);
    }

    // remove addons in `node_modules` that should be hoisted
    for (const name of this._addonsWithSharedDependencies) {
      const pathToAddonNodeModules = path.join(this.baseDir, 'node_modules', name, 'node_modules');
      fs.removeSync(pathToAddonNodeModules);
    }

    this._hasWritten = true;
  }

  addFiles(filesObj) {
    merge(this.files, filesObj);
  }

  buildProjectModel(ProjectClass = ProjectWithoutInternalAddons) {
    if (!this._hasWritten) {
      this.writeSync();
    }

    let pkg = JSON.parse(this.toJSON('package.json'));
    let cli = new MockCLI();
    let root = path.join(this.root, this.name);

    return new ProjectClass(root, pkg, cli.ui, cli);
  }

  addDependency(name, version, optionsOrCallback) {
    const options = getOptionsObjectWithCallbackFunction({ shouldShareDependencies: false }, optionsOrCallback);

    // if we should share dependencies (i.e., if these dependencies are hoisted)
    if (options.shouldShareDependencies) {
      this._addonsWithSharedDependencies.add(name);
    }

    return super.addDependency(name, version, options.callback);
  }

  addDevDependency(name, version, optionsOrCallback) {
    const options = getOptionsObjectWithCallbackFunction({ shouldShareDependencies: false }, optionsOrCallback);

    // if we should share dependencies (i.e., if these dependencies are hoisted)
    if (options.shouldShareDependencies) {
      this._addonsWithSharedDependencies.add(name);
    }

    return super.addDevDependency(name, version, options.callback);
  }

  addAddon(name, version = '0.0.0', optionsOrCallback) {
    const options = getOptionsObjectWithCallbackFunction({ allowCachingPerBundle: false }, optionsOrCallback);

    return this.addDependency(name, version, {
      ...options,
      callback: (addon) => {
        prepareAddon(addon, options);

        // call original `options.callback` if it exists
        if (typeof options.callback === 'function') {
          options.callback(addon);
        }
      },
    });
  }

  addDevAddon(name, version = '0.0.0', optionsOrCallback) {
    const options = getOptionsObjectWithCallbackFunction({ allowCachingPerBundle: false }, optionsOrCallback);

    return this.addDevDependency(name, version, {
      ...options,
      callback: (addon) => {
        prepareAddon(addon, options);

        // call original `options.callback` if it exists
        if (typeof options.callback === 'function') {
          options.callback(addon);
        }
      },
    });
  }

  addEngine(
    name,
    version = '0.0.0',
    options = { allowCachingPerBundle: false, shouldShareDependencies: false, enableLazyLoading: false }
  ) {
    const callback = (engine) => {
      engine.pkg.keywords.push('ember-engine');

      // call original callback if it exists
      if (typeof options.callback === 'function') {
        options.callback(engine);
      }
    };

    if (options.enableLazyLoading) {
      return this.addAddon(name, version, {
        ...options,
        additionalContent: 'lazyLoading: { enabled: true },',
        callback,
      });
    }

    return this.addAddon(name, version, { ...options, callback });
  }

  addInRepoAddon(name, version = '0.0.0', optionsOrCallback) {
    const options = getOptionsObjectWithCallbackFunction(
      { allowCachingPerBundle: false, shouldShareDependencies: true },
      optionsOrCallback
    );

    // if we should share dependencies (in-repo addons (in general) do not have a local `node_modules`)
    // this defaults to `true` for in-repo addons/engines
    if (options.shouldShareDependencies) {
      this._inRepoAddonsWithSharedDependencies.add(name);
    }

    const inRepoAddon = new EmberCLIFixturifyProject(name, version, (addon) => {
      prepareAddon(addon, options);

      if (typeof options.callback === 'function') {
        options.callback(addon);
      }
    });

    // configure the current project to have an ember-addon configured at the
    // appropriate path, i.e. under a common root directory (lib).
    const addonRootDir = 'lib';

    // Add to ember-addon.paths list
    let addon = (this.pkg['ember-addon'] = this.pkg['ember-addon'] || {});
    addon.paths = addon.paths || [];

    const addonPath = `${addonRootDir}/${name}`;

    if (addon.paths.find((path) => path.toLowerCase() === addonPath.toLowerCase())) {
      throw new Error(`project: ${this.name} already contains the in-repo-addon: ${name}`);
    }

    addon.paths.push(addonPath);

    this.files[addonRootDir] = this.files[addonRootDir] || {};

    let addonJSON = inRepoAddon.toJSON();
    Object.assign(this.files[addonRootDir], addonJSON);
  }

  addInRepoEngine(
    name,
    version = '0.0.0',
    options = { allowCachingPerBundle: false, shouldShareDependencies: true, enableLazyLoading: false }
  ) {
    const callback = (engine) => {
      engine.pkg.keywords.push('ember-engine');

      // call original callback if it exists
      if (typeof options.callback === 'function') {
        options.callback(engine);
      }
    };

    if (options.enableLazyLoading) {
      return this.addInRepoAddon(name, version, {
        ...options,
        additionalContent: 'lazyLoading: { enabled: true },',
        callback,
      });
    }

    return this.addInRepoAddon(name, version, { ...options, callback });
  }
};
