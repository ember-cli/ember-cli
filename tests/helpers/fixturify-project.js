'use strict';

const path = require('path');
const merge = require('lodash/merge');
// this is a test-only dependency
// eslint-disable-next-line n/no-unpublished-require
const { Project: FixturifyProject } = require('fixturify-project');
const Project = require('../../lib/models/project');
const MockCLI = require('./mock-cli');
const { readFile } = require('fs/promises');

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
  addon.files['index.js'] =
    options.addonEntryPoint ||
    `module.exports = {
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
  async write() {
    await super.write(...arguments);
    this._hasWritten = true;
  }

  addFiles(filesObj) {
    merge(this.files, filesObj);
  }

  async buildProjectModel(ProjectClass = ProjectWithoutInternalAddons) {
    if (!this._hasWritten) {
      await this.write();
    }

    let cli = new MockCLI();

    return new ProjectClass(this.baseDir, this.pkg, cli.ui, cli);
  }

  async buildProjectModelForInRepoAddon(addonName, ProjectClass = ProjectWithoutInternalAddons) {
    if (!this._hasWritten) {
      await this.write();
    }

    let root = path.join(this.baseDir, 'lib', addonName);
    let pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
    let cli = new MockCLI();

    return new ProjectClass(root, pkg, cli.ui, cli);
  }

  /**
   * Add an entry for this object's `dependencies` list. When this object is written out, the
   * dependency will also then write out appropriate files in this object's `node_modules' subdirectory.
   *
   * @param {String} name name of the dependency to add
   * @param {String} version version of the dependency to add
   * @param {Object|Function} optionsOrCallback options to configure the new FixturifyProject, or a callback function to call after creating
   * the dependency's FixturifyProject. If the parameter is a function, it will be assumed to be a callback function. If instead
   * the parameter is an object, a callback function can be provided using the property 'callback' in the object.
   * @returns the new  FixturifyProject
   */
  addDependency(name, version, optionsOrCallback) {
    const options = getOptionsObjectWithCallbackFunction(optionsOrCallback);
    return super.addDependency(new this.constructor(name, version), options.callback);
  }

  /**
   * Add an entry to this object's `devDependencies` list. When this object is written out, the
   * dependency will also then write out appropriate files in this object's `node_modules' subdirectory.
   *
   * @param {String} name name of the dev dependency to add
   * @param {String} version version of the dev dependency to add
   * @param {Object|Function} optionsOrCallback options to configure the new FixturifyProject, or a callback function to call after creating
   * the dependency's FixturifyProject. If the parameter is a function, it will be assumed to be a callback function. If instead
   * the parameter is an object, a callback function can be provided using the property 'callback' in the object.
   * @returns the new  FixturifyProject
   */
  addDevDependency(name, version, optionsOrCallback) {
    const options = getOptionsObjectWithCallbackFunction(optionsOrCallback);
    return super.addDevDependency(name, version, options.callback);
  }

  /**
   * Add an addon to this object's `dependencies` list. The addon files will be written in
   * this object's `node_modules/<addon_name>` directory when this object is written out.
   *
   * @param {String} name name of the addon
   * @param {String} version version of the addon, defaults to '0.0.0'
   * @param {Object|Function} optionsOrCallback an object consisting of properties and values to apply when creating
   * the addon, or a callback function to pass the newly-created FixturifyProject to. Important options
   * include 'allowCachingPerBundle' (true if the addon can be proxied, defaults to false) and 'callback' (if you want to include
   * a callback function while also specifying other properties.)
   * @returns {FixturifyProject} the newly-created addon
   */
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

  /**
   * Add an addon to this object's `devDependencies` list. The addon files will be written in
   * this object's `node_modules/<addon_name>` directory when this object is written out.
   *
   * @param {String} name name of the addon
   * @param {String} version version of the addon, defaults to '0.0.0'
   * @param {Object|Function} optionsOrCallback an object consisting of properties and values to apply when creating
   * the addon, or a callback function to pass the newly-created FixturifyProject to. Important options
   * include 'allowCachingPerBundle' (true if the addon can be proxied, defaults to false) and 'callback' (if you want to include
   * a callback function while also specifying other properties.)
   * @returns {FixturifyProject} the newly-created addon
   */
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

  /**
   * Add an addon to this object's `dependencies` list. The engine's addon files will be written in
   * this object's `node_modules/<addon_name>` directory when this object is written out.
   *
   * @param {String} name name of the engine
   * @param {String} version version of the engine, defaults to '0.0.0'
   * @param {Object|Function} optionsOrCallback an object consisting of properties and values to apply when creating
   * the engine, or a callback function to pass the newly-created FixturifyProject to. Important options
   * include 'allowCachingPerBundle' (true if the engine can be proxied, defaults to false), 'enableLazyLoading' (true
   * if the engine is to be lazily loaded, defaults to false) and 'callback' (if you want to include
   * a callback function while also specifying other properties.)
   * @returns {FixturifyProject} the newly-created engine addon
   */
  addEngine(name, version = '0.0.0', options = { allowCachingPerBundle: false, enableLazyLoading: false }) {
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

  /**
   * Add an in-repo addon to this object. The addon files will be written in
   * this object's `lib/<addon_name>` directory when this object is written out.
   *
   * @param {String} name name of the addon
   * @param {String} version version of the addon, defaults to '0.0.0'
   * @param {Object|Function} optionsOrCallback an object consisting of properties and values to apply when creating
   * the addon, or a callback function to pass the newly-created FixturifyProject to. Important options
   * include 'allowCachingPerBundle' (true if the addon can be proxied, defaults to false) and 'callback' (if you want to include
   * a callback function while also specifying other properties.)
   * @returns {FixturifyProject} the newly-created addon
   */
  async addInRepoAddon(name, version = '0.0.0', optionsOrCallback) {
    const options = getOptionsObjectWithCallbackFunction({ allowCachingPerBundle: false }, optionsOrCallback);

    let inRepoAddon;

    await new Promise((resolve) => {
      inRepoAddon = new EmberCLIFixturifyProject(name, version, async (addon) => {
        prepareAddon(addon, options);

        if (typeof options.callback === 'function') {
          await options.callback(addon);
          resolve();
        } else {
          resolve();
        }
      });
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

    inRepoAddon.baseDir = path.join(this.baseDir, addonRootDir, inRepoAddon.pkg.name);

    await inRepoAddon.write();
    return inRepoAddon;
  }

  /**
   * Add an in-repo engine to this object. The engine files will be written in
   * this object's `lib/<engine-name>` directory when this object is written out.
   *
   * @param {String} name name of the engine
   * @param {String} version version of the engine, defaults to '0.0.0'
   * @param {Object|Function} optionsOrCallback an object consisting of properties and values to apply when creating
   * the engine, or a callback function to pass the newly-created FixturifyProject to. Important options
   * include 'allowCachingPerBundle' (true if the addon can be proxied, defaults to false), 'enableLazyLoading' (true
   * if the engine is to be lazily loaded, defaults to false)  and 'callback' (if you want to include
   * a callback function while also specifying other properties.)
   * @returns {FixturifyProject} the newly-created addon
   */
  addInRepoEngine(name, version = '0.0.0', options = { allowCachingPerBundle: false, enableLazyLoading: false }) {
    const callback = async (engine) => {
      engine.pkg.keywords.push('ember-engine');

      // call original callback if it exists
      if (typeof options.callback === 'function') {
        await options.callback(engine);
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
