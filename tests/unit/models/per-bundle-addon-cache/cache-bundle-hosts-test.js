'use strict';

/**
 * Tests for checking that the list of 'bundle hosts' in the cache is correct.
 * A 'bundle host' is either the project or a lazy engine.
 */
const path = require('path');
const expect = require('chai').expect;

const projectRootPath = path.resolve(__dirname, '../../../..');
const Helpers = require(`${projectRootPath}/tests/helpers/per-bundle-addon-cache-helpers`);
const Project = require(`${projectRootPath}/lib/models/project`);

const TARGET_INSTANCE = require(`${projectRootPath}/lib/models/per-bundle-addon-cache/target-instance`);

describe('Unit | per-bundle-addon-cache bundle host', function () {
  let project;

  before('setup fixture', function setup() {
    let fixture = Helpers.createStandardCacheFixture();
    project = fixture.buildProjectModel(Project);
    project.initializeAddons();
  });

  it('Should have 4 inRepo addons in project', function () {
    // project should contain 4 children, 3 of which are engines and 1 is a regular addon.
    expect(project._packageInfo.inRepoAddons.length).to.equal(4);
  });

  it('project.perBundleAddonCache should exist', function () {
    expect(project.perBundleAddonCache).to.exist;
  });

  it('Should have 3 bundle hosts (project, lazy-engine-a, lazy-engine-b)', function () {
    const bundleHostCache = project.perBundleAddonCache.bundleHostCache;

    expect(bundleHostCache.size).to.equal(3); // project, lazy engine A, lazy engine B

    const keys = Array.from(bundleHostCache.keys());
    expect(keys.includes('__PROJECT__')).to.equal(true);
    expect(keys.includes('lazy-engine-a')).to.equal(true);
    expect(keys.includes('lazy-engine-b')).to.equal(true);
  });

  it('Should not have any addonInstanceCache entries', function () {
    const bundleHostCache = project.perBundleAddonCache.bundleHostCache;

    // check the form of the cache entries - nobody is flagged as allowCachingPerBundle
    // in this test.
    const keys = Array.from(bundleHostCache.keys());

    keys.forEach((key) => {
      let value = bundleHostCache.get(key);
      expect(value.addonInstanceCache && value.addonInstanceCache.size).to.equal(0);
      expect(value.realPath).to.exist;
      expect(value[TARGET_INSTANCE]).not.to.exist;
    });
  });
});
