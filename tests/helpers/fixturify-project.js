'use strict';

const path = require('path');
const fs = require('fs-extra');
const merge = require('lodash/merge');
// this is a test-only dependency
// eslint-disable-next-line n/no-unpublished-require
const { Project: FixturifyProject } = require('fixturify-project');
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

    // in-repo addons are not real dependencies (they live in `lib/`, not
    // `node_modules/`), so they are not written by the upstream `write`;
    // write each one into `lib/<name>` ourselves
    for (let inRepoAddon of this._inRepoAddons || []) {
      inRepoAddon.baseDir = path.join(this.baseDir, 'lib', inRepoAddon.name);
      await inRepoAddon.write();
    }

    this._hasWritten = true;
  }

  addFiles(filesObj) {
    merge(this.files, filesObj);
  }

  async buildProjectModel(ProjectClass = ProjectWithoutInternalAddons) {
    if (!this._hasWritten) {
      await this.write();
    }

    let pkg = fs.readJsonSync(path.join(this.baseDir, 'package.json'));
    let cli = new MockCLI();

    return new ProjectClass(this.baseDir, pkg, cli.ui, cli);
  }

  async buildProjectModelForInRepoAddon(addonName, ProjectClass = ProjectWithoutInternalAddons) {
    if (!this._hasWritten) {
      await this.write();
    }

    let root = path.join(this.baseDir, 'lib', addonName);
    let pkg = fs.readJsonSync(path.join(root, 'package.json'));
    let cli = new MockCLI();

    return new ProjectClass(root, pkg, cli.ui, cli);
  }

  /**
   * Add an entry for this object's `dependencies` list. When this object is written out, the
   * dependency will also then write out appropriate files in this object's `node_modules' subdirectory.
   *
   * The new dependency is created as an instance of this class (upstream would create a plain
   * fixturify-project `Project`), so that ember-cli-specific helpers (`addAddon`,
   * `addReferenceDependency`, etc.) are available on nested dependencies.
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
   * Add a 'reference' entry to this object's `dependencies` list. A 'reference' dependency is
   * an entry in `dependencies` where the caller knows the dependency's source files are being
   * created elsewhere in the project tree, so no source files should be created locally in
   * `node_modules`, which is the standard FixturifyProject (and node-fixturify-project) behavior.
   * We do this by adding the necessary reference to `dependencies` when `package.json` is
   * generated during `write`.
   *
   * This is used when two addons wish to share a single definition on disk for a dependency (various parts of
   * ember-cli optimize processing based on paths on disk.)
   *
   * Because there is no FixturifyProject being created, no callback is given as in other methods.
   *
   * @param {String} name name of the dependency
   * @param {String} version version of the dependency, defaults to '*'. For our purposes, '*' means
   * "whatever version was specified elsewhere."
   */
  addReferenceDependency(name, version = '*') {
    if (!this._referenceDependencies) {
      this._referenceDependencies = {};
    }

    this._referenceDependencies[name] = version;
  }

  /**
   * Add an entry to this object's `devDependencies` list. When this object is written out, the
   * dependency will also then write out appropriate files in this object's `node_modules' subdirectory.
   *
   * As with `addDependency`, the new dependency is created as an instance of this class.
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
    return super.addDevDependency(new this.constructor(name, version), options.callback);
  }

  /**
   * Add a 'reference' entry to this object's `devDependencies` list. A 'reference' devDependency is
   * an entry in `devDependencies` where the caller knows the dependency's source files are being
   * created elsewhere in the project tree, so no source files should be created locally in
   * `node_modules`, which is the standard FixturifyProject (and node-fixturify-project) behavior.
   * We do this by adding the necessary reference to `devDependencies` when `package.json` is
   * generated during `write`.
   *
   * This is used when two addons wish to share a single definition on disk for a devDependency
   * (various parts of ember-cli optimize processing based on paths on disk.)
   *
   * Because there is no FixturifyProject being created, no callback is given as in other methods.
   *
   * @param {String} name name of the devDependency
   * @param {String} version version of the devDependency, defaults to '*'. For our purposes, '*' means
   * "whatever version was specified elsewhere."
   */
  addReferenceDevDependency(name, version = '*') {
    if (!this._referenceDevDependencies) {
      this._referenceDevDependencies = {};
    }

    this._referenceDevDependencies[name] = version;
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
  addInRepoAddon(name, version = '0.0.0', optionsOrCallback) {
    const options = getOptionsObjectWithCallbackFunction({ allowCachingPerBundle: false }, optionsOrCallback);

    const inRepoAddon = new EmberCLIFixturifyProject(name, version, (addon) => {
      prepareAddon(addon, options);

      if (typeof options.callback === 'function') {
        options.callback(addon);
      }
    });

    // configure the current project to have an ember-addon configured at the
    // appropriate path, i.e. under a common root directory (lib).
    const addonPath = `lib/${name}`;

    // Add to ember-addon.paths list
    let addon = (this.pkg['ember-addon'] = this.pkg['ember-addon'] || {});
    addon.paths = addon.paths || [];

    if (addon.paths.find((path) => path.toLowerCase() === addonPath.toLowerCase())) {
      throw new Error(`project: ${this.name} already contains the in-repo-addon: ${name}`);
    }

    addon.paths.push(addonPath);

    this._inRepoAddons = this._inRepoAddons || [];
    this._inRepoAddons.push(inRepoAddon);

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

  /**
   * Applies the 'reference' dependencies (see `addReferenceDependency` and
   * `addReferenceDevDependency`) to the generated `package.json` contents when this
   * project is written to disk.
   *
   * This overrides a private fixturify-project method, as there is no public hook for
   * customizing the generated `package.json`.
   */
  pkgJSONWithDeps(resolvedLinks) {
    const pkg = super.pkgJSONWithDeps(resolvedLinks);

    if (this._referenceDependencies) {
      pkg.dependencies = Object.assign({}, pkg.dependencies, this._referenceDependencies);
    }

    if (this._referenceDevDependencies) {
      pkg.devDependencies = Object.assign({}, pkg.devDependencies, this._referenceDevDependencies);
    }

    return pkg;
  }
};
