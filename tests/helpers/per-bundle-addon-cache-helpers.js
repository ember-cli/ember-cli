'use strict';

const FixturifyProject = require('./fixturify-project');

const { TARGET_INSTANCE } = require('../../lib/models/per-bundle-addon-cache/target-instance');

class AddonCounts {
  _countAddons(addon) {
    addon.addons.forEach((addon) => {
      this.count.add(addon);
      this.totalCount++;
      if (addon[TARGET_INSTANCE]) {
        this.proxyCount++;
      }

      const addonName = addon.name || addon.constructor.name;
      if (!this.byName[addonName]) {
        this.byName[addonName] = new Set();
      }
      this.byName[addonName].add(addon);
      this._countAddons(addon);
    });
  }

  constructor(projectOrAddon) {
    this.root = projectOrAddon;
    this.count = new Set();
    this.totalCount = 0;
    this.proxyCount = 0;
    this.byName = {};

    this._countAddons(projectOrAddon);
  }

  /**
   * Return the total count of instances and proxies for a given addon name.
   * @param {String} addonName
   * @returns {Object} 2 fields: 'instances' and 'proxies'.
   */
  countInstancesAndProxies(addonName) {
    let instances = 0;
    let proxies = 0;
    this.byName[addonName].forEach((addon) => {
      if (addon[TARGET_INSTANCE]) {
        proxies++;
      } else {
        instances++;
      }
    });

    return { instances, proxies };
  }
}

/**
 * Simple utilities to help test the PerBundleAddonCache feature.
 */
module.exports = {
  /**
   * Allow configuration of the main filename and the 'allowCachingPerBundle' setting in
   * an addon fixture.
   *
   * @param {FixturifyProject} addon the addon to be configured
   * @param {String} mainFileName the name of the main file, defaulting to 'index.js'
   * @param {Boolean} allowCachingPerBundle whether the addon should allow caching per
   * bundle, defaulting to false.
   */
  configureAddonMainFileContents(addon, allowCachingPerBundle = false, mainFileName = 'index.js') {
    addon.files[mainFileName] = `
const { name } = require('./package.json');

module.exports = {
  name,
  allowCachingPerBundle: ${allowCachingPerBundle},
};
  `;
  },

  /**
   * Add a 'dependencies' entry to the toJSON() data for a FixturifyProject (or its
   * internal descendants via a path, without adding a corresponding FixturifyProject
   * to its node_modules. This will show up in package.json only.
   *
   * @param {Object} fixtureData the result of taking a FixturifyProject (the root
   * one that will ultimately be written out and running toJSON() on it.) We pass it
   * in because we want to allow multiple paths to be updated.
   * @param {Array} path a string with slashes as separators, the path from the fixtureData root object
   * to the object that's actually going to be modified.
   * @param {String} the version
   */
  addInheritedDependency(fixtureData, path, addonName) {
    let pathSegments = path.split('/');

    let node = fixtureData;
    pathSegments.forEach((segment) => {
      node = node[segment];
    });

    let pkg = JSON.parse(node['package.json']);
    pkg.dependencies[addonName] = '*';
    node['package.json'] = JSON.stringify(pkg, null, 2);
    return fixtureData;
  },

  /**
   * Generate the file structure used for the cache-bundle-hosts and enable-cache tests.
   * Puts it into the usual temporary location defined by ECFP.
   *
   * In this fixture, all the addon definitions are to be held in PROJECT/lib, even
   * though the project itself doesn't directly depend on a few of them. This is so
   * it's easier to create a single reference to a particular addon path, to enable
   * the proxy code to function.
   */
  createStandardCacheFixture() {
    let fp = new FixturifyProject('test-ember-project', '1.0.0', (project) => {
      project.addInRepoAddon('test-addon-a', '1.0.0', (addonA) => {
        this.configureAddonMainFileContents(addonA);
        addonA.addInRepoAddon('test-addon-dep', '1.0.0', (addonDep) => {
          this.configureAddonMainFileContents(addonDep);
        });

        // At this point, TAD has been run through toJSON inside of TAA.
        // TAD itself has no issues.
        // in TAA, we want to store all the inrepo addons, at any level, in
        // PROJ/lib, so move TAD from TAA and change its path in TAA.
        addonA.pkg['ember-addon'].paths = ['../test-addon-dep'];
        project.files.lib = project.files.lib || {};
        project.files.lib['test-addon-dep'] = addonA.files.lib['test-addon-dep'];
        delete addonA.files.lib;
      });

      project.addInRepoEngine('lazy-engine-a', '1.0.0', true, (lazyEngineA) => {
        lazyEngineA.addInRepoAddon('test-engine-dep', '1.0.0', (engineDep) => {
          this.configureAddonMainFileContents(engineDep);
        });

        // Similar to above
        lazyEngineA.pkg['ember-addon'].paths = ['../test-engine-dep'];
        project.files.lib['test-engine-dep'] = lazyEngineA.files.lib['test-engine-dep'];
        delete lazyEngineA.files.lib;
      });

      project.addInRepoEngine('lazy-engine-b', '1.0.0', true, (lazyEngineB) => {
        lazyEngineB.addInRepoAddon('test-engine-dep', '1.0.0');
        lazyEngineB.addInRepoAddon('test-addon-dep', '1.0.0');

        // These two addon definitions have already been moved to project, so just
        // fix the ember-addon.paths and remove the files.lib entry.
        lazyEngineB.pkg['ember-addon'].paths = ['../test-engine-dep', '../test-addon-dep'];
        delete lazyEngineB.files.lib;
      });

      project.addInRepoEngine('regular-engine-c', '1.0.0', false, (regularEngineC) => {
        regularEngineC.addInRepoAddon('test-engine-dep', '1.0.0');

        // Similar to above
        regularEngineC.pkg['ember-addon'].paths = ['../test-engine-dep'];
        delete regularEngineC.files.lib;
      });
    });

    return fp;
  },

  AddonCounts,
};
