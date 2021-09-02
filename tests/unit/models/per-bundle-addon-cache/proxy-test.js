'use strict';

/**
 * Tests for the various proxies and instances once the project has initialized
 * its addons
 */
const expect = require('chai').expect;
const FixturifyProject = require('../../../../tests/helpers/fixturify-project');

const {
  findAddonCacheEntriesByName,
  createStandardCacheFixture,
  getAllAddonsByNameWithinHost,
  areAllInstancesEqualWithinHost,
  countAddons,
} = require('../../../../tests/helpers/per-bundle-addon-cache');

const Project = require('../../../../lib/models/project');
const { TARGET_INSTANCE } = require('../../../../lib/models/per-bundle-addon-cache/target-instance');

describe('models/per-bundle-addon-cache', function () {
  let fixturifyProject;

  beforeEach(function () {
    fixturifyProject = new FixturifyProject('awesome-proj', '1.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
  });

  afterEach(function () {
    fixturifyProject.dispose();
  });

  it('simple case: bundle addon caching within a single project host', function () {
    fixturifyProject.addInRepoAddon('foo', '1.0.0', { allowCachingPerBundle: true });
    fixturifyProject.addInRepoAddon('foo-bar', '1.0.0', {
      callback: (inRepoAddon) => {
        inRepoAddon.pkg['ember-addon'].paths = ['../foo'];
      },
    });

    fixturifyProject.writeSync();
    let project = fixturifyProject.buildProjectModel();

    project.initializeAddons();

    expect(areAllInstancesEqualWithinHost(project, 'foo')).to.be.true;
  });

  it('it should create multiple proxies within a project host', function () {
    fixturifyProject.addInRepoAddon('foo', '1.0.0', { allowCachingPerBundle: true });

    for (let i = 0; i < 10; i++) {
      fixturifyProject.addInRepoAddon(`foo-bar-${i}`, '1.0.0', {
        callback: (inRepoAddon) => {
          inRepoAddon.pkg['ember-addon'].paths = ['../foo'];
        },
      });
    }

    fixturifyProject.writeSync();
    let project = fixturifyProject.buildProjectModel();

    project.initializeAddons();

    expect(areAllInstancesEqualWithinHost(project, 'foo')).to.be.true;
  });

  it('it should create a proxy for a regular addon when added as a dependency to an in-repo addon', function () {
    fixturifyProject.addAddon('foo', '1.0.0', { allowCachingPerBundle: true });

    for (let i = 0; i < 10; i++) {
      fixturifyProject.addInRepoAddon(`foo-bar-${i}`, '1.0.0', {
        callback: (inRepoAddon) => {
          inRepoAddon.addReferenceDependency('foo', '1.0.0');
        },
      });
    }

    fixturifyProject.writeSync();
    let project = fixturifyProject.buildProjectModel();

    project.initializeAddons();

    expect(areAllInstancesEqualWithinHost(project, 'foo')).to.be.true;
  });

  it('it should create a proxy for a regular addon when added as a dependency to a regular addon', function () {
    fixturifyProject.addAddon('foo', '1.0.0', { allowCachingPerBundle: true });

    for (let i = 0; i < 10; i++) {
      fixturifyProject.addAddon(`foo-bar-${i}`, '1.0.0', {
        callback: (addon) => {
          addon.addReferenceDependency('foo', '1.0.0');
        },
      });
    }

    fixturifyProject.writeSync();
    let project = fixturifyProject.buildProjectModel();

    project.initializeAddons();

    expect(areAllInstancesEqualWithinHost(project, 'foo')).to.be.true;
  });

  it('it should create a proxy to a target "real addon" per host', function () {
    fixturifyProject.addAddon('foo', '1.0.0', { allowCachingPerBundle: true });

    fixturifyProject.addInRepoEngine('in-repo-lazy-engine', '1.0.0', {
      enableLazyLoading: true,
      callback: (lazyEngine) => {
        lazyEngine.addReferenceDependency('foo', '1.0.0');
        lazyEngine.addReferenceDependency('foo-bar', '1.0.0');
      },
    });

    fixturifyProject.addAddon('foo-bar', '1.0.0', {
      callback: (addon) => {
        addon.addReferenceDependency('foo', '1.0.0');
      },
    });

    fixturifyProject.writeSync();
    let project = fixturifyProject.buildProjectModel();

    project.initializeAddons();

    expect(areAllInstancesEqualWithinHost(project, 'foo')).to.be.true;

    // addons within lazy engine host are cached
    expect(
      areAllInstancesEqualWithinHost(
        project.addons.find((addon) => addon.name === 'in-repo-lazy-engine'),
        'foo'
      )
    ).to.be.true;
  });

  describe('when `EMBER_ENGINES_ADDON_DEDUPE` is enabled', function () {
    beforeEach(function () {
      process.env.EMBER_ENGINES_ADDON_DEDUPE = true;
    });

    afterEach(function () {
      delete process.env.EMBER_ENGINES_ADDON_DEDUPE;
    });

    it('it should create a proxy to a target "real addon" using the project host', function () {
      fixturifyProject.addAddon('foo', '1.0.0', { allowCachingPerBundle: true });

      fixturifyProject.addInRepoEngine('in-repo-lazy-engine', '1.0.0', {
        enableLazyLoading: true,
        callback: (lazyEngine) => {
          lazyEngine.addReferenceDependency('foo', '1.0.0');
          lazyEngine.addReferenceDependency('foo-bar', '1.0.0');
        },
      });

      fixturifyProject.addAddon('foo-bar', '1.0.0', {
        callback: (addon) => {
          addon.addReferenceDependency('foo', '1.0.0');
        },
      });

      fixturifyProject.writeSync();
      let project = fixturifyProject.buildProjectModel();

      project.initializeAddons();

      // we use project addon instance as the "real addon"
      expect(areAllInstancesEqualWithinHost(project, 'foo')).to.be.true;

      const { realAddon: realAddonForProject, proxies: proxiesForProject } = getAllAddonsByNameWithinHost(
        project,
        'foo'
      );
      const { proxies: proxiesForEngine } = getAllAddonsByNameWithinHost(
        project.addons.find((addon) => addon.name === 'in-repo-lazy-engine'),
        'foo'
      );

      expect(
        [...proxiesForProject, ...proxiesForEngine].every((proxy) => proxy[TARGET_INSTANCE] === realAddonForProject)
      ).to.be.true;
    });

    it('addon with `allowCachingPerBundle`, 1 in each of 2 lazy engines; project also depends on this addon', function () {
      fixturifyProject.addAddon('test-addon-a', '1.0.0', { allowCachingPerBundle: true });

      fixturifyProject.addEngine('lazy-engine-a', '1.0.0', {
        enableLazyLoading: true,
        callback: (engine) => {
          engine.addReferenceDependency('test-addon-a', '1.0.0');
        },
      });

      fixturifyProject.addEngine('lazy-engine-b', '1.0.0', {
        enableLazyLoading: true,
        callback: (engine) => {
          engine.addReferenceDependency('test-addon-a', '1.0.0');
        },
      });

      let project = fixturifyProject.buildProjectModel();
      project.initializeAddons();

      let counts = countAddons(project);

      expect(counts.byName['lazy-engine-a'].addons.length).to.equal(1);
      expect(counts.byName['lazy-engine-b'].addons.length).to.equal(1);

      expect(counts.proxyCount).to.equal(2);
      expect(project.perBundleAddonCache.numProxies).to.equal(2);

      expect(counts.byName['test-addon-a'].realAddonInstanceCount).to.equal(1);
      expect(counts.byName['test-addon-a'].proxyCount).to.equal(2);

      let cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, 'lazy-engine-a', 'test-addon-a');
      expect(cacheEntries).to.exist;

      // project cache should be used
      expect(cacheEntries.length).to.equal(0);

      cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, 'lazy-engine-b', 'test-addon-a');
      expect(cacheEntries).to.exist;

      // project cache should be used
      expect(cacheEntries.length).to.equal(0);
    });

    it('2 lazy engines; each depend on two addons; project also depends on these addons, ensure project cache is used', function () {
      fixturifyProject.addInRepoAddon('test-addon-a', '1.0.0', {
        allowCachingPerBundle: true,
        callback: (addon) => {
          addon.pkg['ember-addon'].paths = ['../test-addon-b'];
        },
      });

      fixturifyProject.addInRepoAddon('test-addon-b', '1.0.0', { allowCachingPerBundle: true });

      fixturifyProject.addInRepoEngine('lazy-engine-a', '1.0.0', {
        allowCachingPerBundle: true,
        enableLazyLoading: true,
        callback: (engine) => {
          engine.pkg['ember-addon'].paths = ['../test-addon-a', '../test-addon-b'];
        },
      });

      fixturifyProject.addInRepoEngine('lazy-engine-b', '1.0.0', {
        allowCachingPerBundle: true,
        enableLazyLoading: true,
        callback: (engine) => {
          engine.pkg['ember-addon'].paths = ['../test-addon-a', '../test-addon-b'];
        },
      });

      let project = fixturifyProject.buildProjectModel();
      project.initializeAddons();

      let { byName } = countAddons(project);

      expect(byName['lazy-engine-a'].realAddonInstanceCount).to.equal(1);
      expect(byName['lazy-engine-a'].proxyCount).to.equal(0);

      expect(byName['lazy-engine-b'].realAddonInstanceCount).to.equal(1);
      expect(byName['lazy-engine-b'].proxyCount).to.equal(0);

      expect(byName['test-addon-a'].realAddonInstanceCount).to.equal(1);
      expect(byName['test-addon-a'].proxyCount).to.equal(2);

      expect(byName['test-addon-b'].realAddonInstanceCount).to.equal(1);
      expect(byName['test-addon-b'].proxyCount).to.equal(3);

      let cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, 'lazy-engine-a', 'test-addon-a');
      expect(cacheEntries).to.exist;

      // project cache should be used
      expect(cacheEntries.length).to.equal(0);

      cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, 'lazy-engine-a', 'test-addon-b');
      expect(cacheEntries).to.exist;

      // project cache should be used
      expect(cacheEntries.length).to.equal(0);

      cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, 'lazy-engine-b', 'test-addon-a');
      expect(cacheEntries).to.exist;

      // project cache should be used
      expect(cacheEntries.length).to.equal(0);

      cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, 'lazy-engine-b', 'test-addon-b');
      expect(cacheEntries).to.exist;

      // project cache should be used
      expect(cacheEntries.length).to.equal(0);
    });
  });

  describe('proxy checks with addon counts', function () {
    it('no `allowCachingPerBundle` set, no proxies, verify instance counts', function () {
      let fixture = createStandardCacheFixture();
      let project = fixture.buildProjectModel(Project);
      project.initializeAddons();

      let counts = countAddons(project);

      expect(counts.proxyCount).to.equal(0);
      expect(counts.byName['test-addon-a'].addons.length).to.equal(1);
      expect(counts.byName['test-addon-dep'].addons.length).to.equal(2);
      expect(counts.byName['test-engine-dep'].addons.length).to.equal(3);
      expect(counts.byName['lazy-engine-a'].addons.length).to.equal(1);
      expect(counts.byName['lazy-engine-b'].addons.length).to.equal(1);
      expect(counts.byName['regular-engine-c'].addons.length).to.equal(1);

      // addon cache should also have 0 proxies. test-addon-b was the only addon marked as cacheable,
      // so it will end up in the count of addon instances for the addon cache, but have no proxies.
      expect(project.perBundleAddonCache.numProxies).to.equal(0);
    });

    it('addon with allowCachingPerBundle, 1 instance, the rest proxies', function () {
      // PROJ to TAA, TAB, TAC and TAD. TAB, TAC and TAD have TAA underneath.
      fixturifyProject.addAddon('test-addon-a', '1.0.0', { allowCachingPerBundle: true });
      fixturifyProject.addAddon('test-addon-b', '1.0.0', {
        callback: (addon) => {
          addon.addReferenceDependency('test-addon-a', '*');
        },
      });

      fixturifyProject.addAddon('test-addon-c', '1.0.0', {
        callback: (addon) => {
          addon.addReferenceDependency('test-addon-a', '*');
        },
      });

      fixturifyProject.addAddon('test-addon-d', '1.0.0', {
        callback: (addon) => {
          addon.addReferenceDependency('test-addon-a', '1.0.0');
        },
      });

      let project = fixturifyProject.buildProjectModel();
      project.initializeAddons();

      let counts = countAddons(project);
      expect(counts.proxyCount).to.equal(3);
      expect(project.perBundleAddonCache.numProxies).to.equal(3);
      expect(counts.byName['test-addon-a'].addons.length).to.equal(4);

      expect(counts.byName['test-addon-a'].realAddonInstanceCount).to.equal(1);
      expect(counts.byName['test-addon-a'].proxyCount).to.equal(3);

      expect(counts.byName['test-addon-b'].addons.length).to.equal(1);
      expect(counts.byName['test-addon-c'].addons.length).to.equal(1);
    });

    it('addon with `allowCachingPerBundle`, 1 in lazy engine, one in regular', function () {
      // PROJ to LEA, REB, LEA and REB both depend on TAA
      // Neither instance of test-addon-a is declared in the project, but the one in engine B
      // will be 'owned' by Project as far as PerBundleAddonCache is concerned.
      // Should end with 2 instances of test-addon-a, one in PROJECT, one in lazy-engine-a,
      // and no proxies.
      fixturifyProject.addEngine('lazy-engine-a', '1.0.0', {
        enableLazyLoading: true,
        callback: (engine) => {
          engine.addAddon('test-addon-a', '1.0.0', { allowCachingPerBundle: true });
        },
      });

      fixturifyProject.addEngine('regular-engine-b', '1.0.0', {
        callback: (engine) => {
          engine.addAddon('test-addon-a', '1.0.0', { allowCachingPerBundle: true });
        },
      });

      let project = fixturifyProject.buildProjectModel();
      project.initializeAddons();

      let counts = countAddons(project);

      expect(counts.byName['lazy-engine-a'].addons.length).to.equal(1);
      expect(counts.byName['regular-engine-b'].addons.length).to.equal(1);

      expect(counts.proxyCount).to.equal(0);
      expect(project.perBundleAddonCache.numProxies).to.equal(0);

      expect(counts.byName['test-addon-a'].realAddonInstanceCount).to.equal(2);
      expect(counts.byName['test-addon-a'].proxyCount).to.equal(0);

      let cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, 'lazy-engine-a', 'test-addon-a');
      expect(cacheEntries).to.exist;
      expect(cacheEntries.length).to.equal(1);

      cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, '__PROJECT__', 'test-addon-a');
      expect(cacheEntries).to.exist;
      expect(cacheEntries.length).to.equal(1);
    });

    it('addon with allowCachingPerBundle, 1 in each of 2 lazy engines', function () {
      // Same as above, but regular-engine-b is now lazy-engine-b
      // Should have 2 instances, 1 in LEA, 1 in LEB, separate paths.
      fixturifyProject.addEngine('lazy-engine-a', '1.0.0', {
        enableLazyLoading: true,
        callback: (engine) => {
          engine.addAddon('test-addon-a', '1.0.0', { allowCachingPerBundle: true });
        },
      });

      fixturifyProject.addEngine('lazy-engine-b', '1.0.0', {
        enableLazyLoading: true,
        callback: (engine) => {
          engine.addAddon('test-addon-a', '1.0.0', { allowCachingPerBundle: true });
        },
      });

      let project = fixturifyProject.buildProjectModel();
      project.initializeAddons();

      let counts = countAddons(project);

      expect(counts.byName['lazy-engine-a'].addons.length).to.equal(1);
      expect(counts.byName['lazy-engine-b'].addons.length).to.equal(1);

      expect(counts.proxyCount).to.equal(0);
      expect(project.perBundleAddonCache.numProxies).to.equal(0);

      expect(counts.byName['test-addon-a'].realAddonInstanceCount).to.equal(2);
      expect(counts.byName['test-addon-a'].proxyCount).to.equal(0);

      let cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, 'lazy-engine-a', 'test-addon-a');
      expect(cacheEntries).to.exist;
      expect(cacheEntries.length).to.equal(1);

      cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, 'lazy-engine-b', 'test-addon-a');
      expect(cacheEntries).to.exist;
      expect(cacheEntries.length).to.equal(1);
    });

    it('addon with `allowCachingPerBundle`, 1 in each of 2 lazy engines; project also depends on this addon', function () {
      fixturifyProject.addAddon('test-addon-a', '1.0.0', { allowCachingPerBundle: true });

      fixturifyProject.addEngine('lazy-engine-a', '1.0.0', {
        enableLazyLoading: true,
        callback: (engine) => {
          engine.addReferenceDependency('test-addon-a');
        },
      });

      fixturifyProject.addEngine('lazy-engine-b', '1.0.0', {
        enableLazyLoading: true,
        callback: (engine) => {
          engine.addReferenceDependency('test-addon-a');
        },
      });

      let project = fixturifyProject.buildProjectModel();
      project.initializeAddons();

      let counts = countAddons(project);

      expect(counts.byName['lazy-engine-a'].addons.length).to.equal(1);
      expect(counts.byName['lazy-engine-b'].addons.length).to.equal(1);

      expect(counts.proxyCount).to.equal(0);
      expect(project.perBundleAddonCache.numProxies).to.equal(0);

      expect(counts.byName['test-addon-a'].realAddonInstanceCount).to.equal(3);
      expect(counts.byName['test-addon-a'].proxyCount).to.equal(0);

      let cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, 'lazy-engine-a', 'test-addon-a');
      expect(cacheEntries).to.exist;
      expect(cacheEntries.length).to.equal(1);

      cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, 'lazy-engine-b', 'test-addon-a');
      expect(cacheEntries).to.exist;
      expect(cacheEntries.length).to.equal(1);
    });

    it('addon with allowCachingPerBundle, 2 regular engines - cache entries in project but not declared there', function () {
      // Project declares an in-repo addon TAA. Then remove the ember-addon.paths entry so the project
      // "doesn't know" about it but it's available for engines. Declare 2 non-lazy in-repo engines.
      // Then have them add a shared in-repo dependency to TAA, with the path pointing to the one in
      // PROJ/lib (i.e. '../test-addon-a')
      // Should have 1 instance, 1 proxy, both in project.
      fixturifyProject.addInRepoAddon('test-addon-a', '1.0.0', { allowCachingPerBundle: true });
      fixturifyProject.pkg['ember-addon'].paths = []; // remove the 'dependency' (file still exists)

      fixturifyProject.addInRepoEngine('regular-engine-a', '1.0.0', {
        enableLazyLoading: false,
        shouldShareDependencies: true,
        callback: (inRepoEngine) => {
          inRepoEngine.pkg['ember-addon'].paths = ['../test-addon-a'];
        },
      });

      fixturifyProject.addInRepoEngine('regular-engine-b', '1.0.0', {
        enableLazyLoading: false,
        shouldShareDependencies: true,
        callback: (inRepoEngine) => {
          inRepoEngine.pkg['ember-addon'].paths = ['../test-addon-a'];
        },
      });

      fixturifyProject.writeSync();

      let project = fixturifyProject.buildProjectModel();
      project.initializeAddons();

      let { proxyCount, byName } = countAddons(project);

      expect(byName['regular-engine-a'].addons.length).to.equal(1);
      expect(byName['regular-engine-b'].addons.length).to.equal(1);

      expect(proxyCount).to.equal(1);
      expect(project.perBundleAddonCache.numProxies).to.equal(1);

      expect(byName['test-addon-a'].realAddonInstanceCount).to.equal(1);
      expect(byName['test-addon-a'].proxyCount).to.equal(1);

      let cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, '__PROJECT__', 'test-addon-a');
      expect(cacheEntries).to.exist;
      expect(cacheEntries.length).to.equal(1);
    });

    it('addon with allowCachingPerBundle, 2 regular engines - cache entries in project (also declared there)', function () {
      // Same as above, now both are regular engines.
      // Should have 1 instance, 2 proxies, both in project.
      fixturifyProject.addAddon('test-addon-a', '1.0.0', { allowCachingPerBundle: true });

      fixturifyProject.addEngine('regular-engine-a', '1.0.0', {
        callback: (engine) => {
          engine.addReferenceDependency('test-addon-a', '1.0.0');
        },
      });

      fixturifyProject.addEngine('regular-engine-b', '1.0.0', {
        callback: (engine) => {
          engine.addReferenceDependency('test-addon-a', '1.0.0');
        },
      });

      fixturifyProject.writeSync();

      let project = fixturifyProject.buildProjectModel();
      project.initializeAddons();

      let { proxyCount, byName } = countAddons(project);

      expect(byName['regular-engine-a'].addons.length).to.equal(1);
      expect(byName['regular-engine-b'].addons.length).to.equal(1);

      expect(proxyCount).to.equal(2);
      expect(project.perBundleAddonCache.numProxies).to.equal(2);

      expect(byName['test-addon-a'].realAddonInstanceCount).to.equal(1);
      expect(byName['test-addon-a'].proxyCount).to.equal(2);

      let cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, '__PROJECT__', 'test-addon-a');
      expect(cacheEntries).to.exist;
      expect(cacheEntries.length).to.equal(1);
    });

    it('2 lazy engines; each depend on two addons; ensure that each lazy engine has proxy for subsequent instantiations of duplicate addons', function () {
      fixturifyProject.addInRepoAddon('test-addon-a', '1.0.0', {
        allowCachingPerBundle: true,
        callback: (addon) => {
          addon.pkg['ember-addon'].paths = ['../test-addon-b'];
        },
      });

      fixturifyProject.addInRepoAddon('test-addon-b', '1.0.0', { allowCachingPerBundle: true });
      fixturifyProject.pkg['ember-addon'].paths = []; // project now 'doesn't know' about test-addon-b

      fixturifyProject.addInRepoEngine('lazy-engine-a', '1.0.0', {
        allowCachingPerBundle: true,
        enableLazyLoading: true,
        callback: (engine) => {
          engine.pkg['ember-addon'].paths = ['../test-addon-a', '../test-addon-b'];
        },
      });

      fixturifyProject.addInRepoEngine('lazy-engine-b', '1.0.0', {
        allowCachingPerBundle: true,
        enableLazyLoading: true,
        callback: (engine) => {
          engine.pkg['ember-addon'].paths = ['../test-addon-a', '../test-addon-b'];
        },
      });

      let project = fixturifyProject.buildProjectModel();
      project.initializeAddons();

      let { byName } = countAddons(project);

      expect(byName['lazy-engine-a'].realAddonInstanceCount).to.equal(1);
      expect(byName['lazy-engine-a'].proxyCount).to.equal(0);

      expect(byName['lazy-engine-b'].realAddonInstanceCount).to.equal(1);
      expect(byName['lazy-engine-b'].proxyCount).to.equal(0);

      expect(byName['test-addon-a'].realAddonInstanceCount).to.equal(2);
      expect(byName['test-addon-a'].proxyCount).to.equal(0);

      expect(byName['test-addon-b'].realAddonInstanceCount).to.equal(2);
      expect(byName['test-addon-b'].proxyCount).to.equal(2);

      let cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, 'lazy-engine-a', 'test-addon-a');
      expect(cacheEntries).to.exist;
      expect(cacheEntries.length).to.equal(1);

      cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, 'lazy-engine-a', 'test-addon-b');
      expect(cacheEntries).to.exist;
      expect(cacheEntries.length).to.equal(1);

      cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, 'lazy-engine-b', 'test-addon-a');
      expect(cacheEntries).to.exist;
      expect(cacheEntries.length).to.equal(1);

      cacheEntries = findAddonCacheEntriesByName(project.perBundleAddonCache, 'lazy-engine-b', 'test-addon-b');
      expect(cacheEntries).to.exist;
      expect(cacheEntries.length).to.equal(1);
    });

    it('2 regular engines; each depend on two addons; ensure that project cache is used', function () {
      fixturifyProject.addInRepoAddon('test-addon-a', '1.0.0', {
        allowCachingPerBundle: true,
        callback: (addon) => {
          addon.pkg['ember-addon'].paths = ['../test-addon-b'];
        },
      });

      fixturifyProject.addInRepoAddon('test-addon-b', '1.0.0', { allowCachingPerBundle: true });
      fixturifyProject.pkg['ember-addon'].paths = [];

      fixturifyProject.addInRepoEngine('engine-a', '1.0.0', {
        allowCachingPerBundle: true,
        callback: (engine) => {
          engine.pkg['ember-addon'].paths = ['../test-addon-a', '../test-addon-b'];
        },
      });

      fixturifyProject.addInRepoEngine('engine-b', '1.0.0', {
        allowCachingPerBundle: true,
        callback: (engine) => {
          engine.pkg['ember-addon'].paths = ['../test-addon-a', '../test-addon-b'];
        },
      });

      let project = fixturifyProject.buildProjectModel();
      project.initializeAddons();

      let { byName } = countAddons(project);

      expect(byName['engine-a'].realAddonInstanceCount).to.equal(1);
      expect(byName['engine-a'].proxyCount).to.equal(0);

      expect(byName['engine-b'].realAddonInstanceCount).to.equal(1);
      expect(byName['engine-b'].proxyCount).to.equal(0);

      expect(byName['test-addon-a'].realAddonInstanceCount).to.equal(1);
      expect(byName['test-addon-a'].proxyCount).to.equal(1);

      expect(byName['test-addon-b'].realAddonInstanceCount).to.equal(1);
      expect(byName['test-addon-b'].proxyCount).to.equal(2);
    });

    it('multiple references to a single lazy engine that has opted-in to `allowCachingPerBundle`', function () {
      fixturifyProject.addInRepoEngine('lazy-engine-a', '1.0.0', {
        allowCachingPerBundle: true,
        enableLazyLoading: true,
      });

      fixturifyProject.addInRepoAddon('test-addon-a', '1.0.0', {
        callback: (addon) => {
          addon.pkg['ember-addon'].paths = ['../lazy-engine-a'];
        },
      });

      fixturifyProject.addInRepoAddon('test-addon-b', '1.0.0', {
        callback: (addon) => {
          addon.pkg['ember-addon'].paths = ['../lazy-engine-a'];
        },
      });

      fixturifyProject.addInRepoAddon('test-addon-c', '1.0.0', {
        callback: (addon) => {
          addon.pkg['ember-addon'].paths = ['../lazy-engine-a'];
        },
      });

      let project = fixturifyProject.buildProjectModel();
      project.initializeAddons();

      let { byName } = countAddons(project);

      expect(byName['lazy-engine-a'].realAddonInstanceCount).to.equal(1);
      expect(byName['lazy-engine-a'].proxyCount).to.equal(3);

      expect(areAllInstancesEqualWithinHost(project, 'lazy-engine-a')).to.be.true;
    });
  });
});
