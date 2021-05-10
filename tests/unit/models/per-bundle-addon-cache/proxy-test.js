'use strict';

/**
 * Tests for the various proxies and instances once the project has initialized
 * its addons
 */

const path = require('path');
const expect = require('chai').expect;

const projectRootPath = path.resolve(__dirname, '../../../..');
const FixturifyProject = require(`${projectRootPath}/tests/helpers/fixturify-project`);

const Helpers = require(`${projectRootPath}/tests/helpers/per-bundle-addon-cache-helpers`);
const Project = require(`${projectRootPath}/lib/models/project`);

// hack reference to 'fixturify' so we can do our own fiddling with the result of toJSON() to add
// a reference in the right place.
const fixturify = require('fixturify');

describe('Unit | per-bundle-addon-cache basic proxy checks', function () {
  it(`no 'allowCachingPerBundle' set, no proxies, verify instance counts`, function () {
    let fixture = Helpers.createStandardCacheFixture();
    let project = fixture.buildProjectModel(Project);
    project.initializeAddons();

    let counts = new Helpers.AddonCounts(project);

    expect(counts.proxyCount).to.equal(0);
    expect(counts.byName['test-addon-a'].size).to.equal(1);
    expect(counts.byName['test-addon-dep'].size).to.equal(2);
    expect(counts.byName['test-engine-dep'].size).to.equal(3);
    expect(counts.byName['lazy-engine-a'].size).to.equal(1);
    expect(counts.byName['lazy-engine-b'].size).to.equal(1);
    expect(counts.byName['regular-engine-c'].size).to.equal(1);

    // addon cache should also have 0 proxies. test-addon-b was the only addon marked as cacheable,
    // so it will end up in the count of addon instances for the addon cache, but have no proxies.
    expect(project.perBundleAddonCache.numProxies).to.equal(0);
  });

  it(`addon with allowCachingPerBundle, 1 instance, the rest proxies`, function () {
    // PROJ to TAA, TAB, TAC and TAD. TAB, TAC and TAD have TAA underneath.
    let fixture = new FixturifyProject('test-ember-project', '1.0.0', (project) => {
      project.addAddon('test-addon-a', '1.0.0', (addonA) => {
        Helpers.configureAddonMainFileContents(addonA, true);
      });

      project.addAddon('test-addon-b', '1.0.0', (addonB) => {
        Helpers.configureAddonMainFileContents(addonB, false);
      });

      project.addAddon('test-addon-c', '1.0.0', (addonC) => {
        Helpers.configureAddonMainFileContents(addonC, false);
      });

      project.addAddon('test-addon-d', '1.0.0', (addonD) => {
        Helpers.configureAddonMainFileContents(addonD, false);
      });
    });

    // Add our inherited dependencies, build the model and verify the counts.
    let fixtureData = fixture.toJSON();

    Helpers.addInheritedDependency(fixtureData, 'test-ember-project/node_modules/test-addon-b', 'test-addon-a');
    Helpers.addInheritedDependency(fixtureData, 'test-ember-project/node_modules/test-addon-c', 'test-addon-a');
    Helpers.addInheritedDependency(fixtureData, 'test-ember-project/node_modules/test-addon-d', 'test-addon-a');

    fixturify.writeSync(fixture.root, fixtureData);
    fixture._hasWritten = true; // so buildProjectModel doesn't try again.

    let project = fixture.buildProjectModel(Project);
    project.initializeAddons();

    let counts = new Helpers.AddonCounts(project);

    expect(counts.proxyCount).to.equal(3);
    expect(project.perBundleAddonCache.numProxies).to.equal(3);
    expect(counts.byName['test-addon-a'].size).to.equal(4);
    let addonACounts = counts.countInstancesAndProxies('test-addon-a');
    expect(addonACounts.instances).to.equal(1);
    expect(addonACounts.proxies).to.equal(3);

    expect(counts.byName['test-addon-b'].size).to.equal(1);
    expect(counts.byName['test-addon-c'].size).to.equal(1);
  });

  it(`addon with allowCachingPerBundle, 1 in lazy engine, one in regular`, function () {
    // PROJ to LEA, REB, LEA and REB both depend on TAA
    // Neither instance of test-addon-a is declared in the project, but the one in engine B
    // will be 'owned' by Project as far as PerBundleAddonCache is concerned.
    // Should end with 2 instances of test-addon-a, one in PROJECT, one in lazy-engine-a,
    // and no proxies.
    let fixture = new FixturifyProject('test-ember-project', '1.0.0', (project) => {
      project.addEngine('lazy-engine-a', '1.0.0', true, (engine) => {
        engine.addAddon('test-addon-a', '1.0.0', (addonA) => {
          Helpers.configureAddonMainFileContents(addonA, true);
        });
      });

      project.addEngine('regular-engine-b', '1.0.0', false, (engine) => {
        engine.addAddon('test-addon-a', '1.0.0', (addonA) => {
          Helpers.configureAddonMainFileContents(addonA, true);
        });
      });
    });

    fixture.writeSync();

    let project = fixture.buildProjectModel(Project);
    project.initializeAddons();

    let counts = new Helpers.AddonCounts(project);

    expect(counts.byName['lazy-engine-a'].size).to.equal(1);
    expect(counts.byName['regular-engine-b'].size).to.equal(1);

    expect(counts.proxyCount).to.equal(0);
    expect(project.perBundleAddonCache.numProxies).to.equal(0);
    let addonACounts = counts.countInstancesAndProxies('test-addon-a');
    expect(addonACounts.instances).to.equal(2);
    expect(addonACounts.proxies).to.equal(0);
    let cacheEntries = project.perBundleAddonCache.findAddonCacheEntriesByName('lazy-engine-a', 'test-addon-a');
    expect(cacheEntries).to.exist;
    expect(cacheEntries.length).to.equal(1);
    cacheEntries = project.perBundleAddonCache.findAddonCacheEntriesByName('__PROJECT__', 'test-addon-a');
    expect(cacheEntries).to.exist;
    expect(cacheEntries.length).to.equal(1);
  });

  it(`addon with allowCachingPerBundle, 1 in each of 2 lazy engines`, function () {
    // Same as above, but regular-engine-b is now lazy-engine-b
    // Should have 2 instances, 1 in LEA, 1 in LEB
    let fixture = new FixturifyProject('test-ember-project', '1.0.0', (project) => {
      project.addEngine('lazy-engine-a', '1.0.0', true, (engine) => {
        engine.addAddon('test-addon-a', '1.0.0', (addonA) => {
          Helpers.configureAddonMainFileContents(addonA, true);
        });
      });

      project.addEngine('lazy-engine-b', '1.0.0', true, (engine) => {
        engine.addAddon('test-addon-a', '1.0.0', (addonA) => {
          Helpers.configureAddonMainFileContents(addonA, true);
        });
      });
    });

    fixture.writeSync();

    let project = fixture.buildProjectModel(Project);
    project.initializeAddons();

    let counts = new Helpers.AddonCounts(project);

    expect(counts.byName['lazy-engine-a'].size).to.equal(1);
    expect(counts.byName['lazy-engine-b'].size).to.equal(1);

    expect(counts.proxyCount).to.equal(0);
    expect(project.perBundleAddonCache.numProxies).to.equal(0);
    let addonACounts = counts.countInstancesAndProxies('test-addon-a');
    expect(addonACounts.instances).to.equal(2);
    expect(addonACounts.proxies).to.equal(0);
    let cacheEntries = project.perBundleAddonCache.findAddonCacheEntriesByName('lazy-engine-a', 'test-addon-a');
    expect(cacheEntries).to.exist;
    expect(cacheEntries.length).to.equal(1);
    cacheEntries = project.perBundleAddonCache.findAddonCacheEntriesByName('lazy-engine-b', 'test-addon-a');
    expect(cacheEntries).to.exist;
    expect(cacheEntries.length).to.equal(1);
  });

  /*
  it(`addon with allowCachingPerBundle, 2 regular engines - cache entries in project`, function () {
    // Same as above, now both are regular engines.
    // Should have 1 instance, 1 proxy, both in project.
    let fixture = new FixturifyProject('test-ember-project', '1.0.0', (project) => {
      project.addEngine('regular-engine-a', '1.0.0', false, (engine) => {
        engine.addAddon('test-addon-a', '1.0.0', (addonA) => {
          Helpers.configureAddonMainFileContents(addonA, true);
        });
      });

      project.addEngine('regular-engine-b', '1.0.0', false, (engine) => {
        engine.addAddon('test-addon-a', '1.0.0', (addonA) => {
          Helpers.configureAddonMainFileContents(addonA, true);
        });
      });
    });

    fixture.writeSync();

    let project = fixture.buildProjectModel(Project);
    project.initializeAddons();

    let counts = new Helpers.AddonCounts(project);

    expect(counts.byName['regular-engine-a'].size).to.equal(1);
    expect(counts.byName['regular-engine-b'].size).to.equal(1);

    expect(counts.proxyCount).to.equal(1);
    expect(project.perBundleAddonCache.numProxies).to.equal(1);
    let addonACounts = counts.countInstancesAndProxies('test-addon-a');
    expect(addonACounts.instances).to.equal(1);
    expect(addonACounts.proxies).to.equal(1);
    let cacheEntries = project.perBundleAddonCache.findAddonCacheEntriesByName('__PROJECT__', 'test-addon-a');
    expect(cacheEntries).to.exist;
    expect(cacheEntries.length).to.equal(1);
  });
  */
});
