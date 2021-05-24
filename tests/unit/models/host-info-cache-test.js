'use strict';

/**
 * Tests for the various proxies and instances once the project has initialized
 * its addons
 */
const expect = require('chai').expect;
const FixturifyProject = require('../../helpers/fixturify-project');

describe('Unit | host-addons-utils', function () {
  let fixturifyProject;

  beforeEach(function () {
    fixturifyProject = new FixturifyProject('awesome-proj', '1.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
  });

  afterEach(function () {
    fixturifyProject.dispose();
  });

  it('multiple lazy engines in project, including nested lazy engines', function () {
    fixturifyProject.addEngine('lazy-engine-a', '1.0.0', { enableLazyLoading: true });

    fixturifyProject.addAddon('addon-a', '1.0.0', {
      enableLazyLoading: true,
      callback: (addon) => {
        addon.addEngine('lazy-engine-b', '1.0.0', {
          enableLazyLoading: true,
          callback: (engine) => {
            engine.addReferenceDependency('lazy-engine-a');
            engine.addEngine('lazy-engine-c', '1.0.0', { enableLazyLoading: true });
          },
        });
      },
    });

    fixturifyProject.writeSync();
    let project = fixturifyProject.buildProjectModel();

    project.initializeAddons();

    const app = {};

    const lazyEngineA = project.addons.find((addon) => addon.name === 'lazy-engine-a');
    lazyEngineA.app = app;
    const pkgInfoLazyEngineA = lazyEngineA._packageInfo;

    const addonA = project.addons.find((addon) => addon.name === 'addon-a');
    addonA.app = app;
    const pkgInfoAddonA = addonA._packageInfo;

    let { hostPackageInfo, hostAndAncestorBundledPackageInfos } = project.hostInfoCache.getHostAddonInfo(
      pkgInfoLazyEngineA
    );

    expect(hostPackageInfo).to.equal(project._packageInfo, 'host package-info for lazy-engine A is the project');
    expect(project.hostInfoCache.findLCAHost(lazyEngineA)).to.equal(lazyEngineA.app, 'LCA host is the app');

    expect(hostAndAncestorBundledPackageInfos).to.deep.equal(
      new Set([pkgInfoAddonA]),
      'host packge-infos for lazy-engine A includes only addon-a'
    );

    const lazyEngineB = project.addons
      .find((addon) => addon.name === 'addon-a')
      .addons.find((addon) => addon.name === 'lazy-engine-b');

    const pkgInfoLazyEngineB = lazyEngineB._packageInfo;

    ({ hostPackageInfo, hostAndAncestorBundledPackageInfos } = project.hostInfoCache.getHostAddonInfo(
      pkgInfoLazyEngineB
    ));

    expect(hostPackageInfo).to.equal(project._packageInfo, 'host package-info for lazy-engine B is the project');
    expect(project.hostInfoCache.findLCAHost(lazyEngineB)).to.equal(lazyEngineA.app, 'LCA host is the app');
    expect(hostAndAncestorBundledPackageInfos).to.deep.equal(
      new Set([pkgInfoAddonA]),
      'host packge-infos for lazy-engine B includes only addon-a'
    );

    const lazyEngineC = project.addons
      .find((addon) => addon.name === 'addon-a')
      .addons.find((addon) => addon.name === 'lazy-engine-b')
      .addons.find((addon) => addon.name === 'lazy-engine-c');

    const pkgInfoLazyEngineC = lazyEngineC._packageInfo;

    ({ hostPackageInfo, hostAndAncestorBundledPackageInfos } = project.hostInfoCache.getHostAddonInfo(
      pkgInfoLazyEngineC
    ));

    expect(hostPackageInfo).to.equal(pkgInfoLazyEngineB, 'host package-info for lazy-engine C is lazy engine B');

    expect(project.hostInfoCache.findLCAHost(lazyEngineC)).to.equal(
      lazyEngineB,
      'LCA host for lazy engine C is lazy engine B'
    );

    expect(hostAndAncestorBundledPackageInfos).to.deep.equal(
      new Set([pkgInfoAddonA]),
      'host packge-infos for lazy-engine C includes addon-a'
    );
  });

  it('multiple lazy engines in project, including nested lazy engines; some nested lazy engines have non-lazy deps', function () {
    fixturifyProject.addEngine('lazy-engine-a', '1.0.0', { enableLazyLoading: true });

    fixturifyProject.addAddon('addon-a', '1.0.0', {
      enableLazyLoading: true,
      callback: (addon) => {
        addon.addEngine('lazy-engine-b', '1.0.0', {
          enableLazyLoading: true,
          callback: (engine) => {
            engine.addReferenceDependency('lazy-engine-a');
            engine.addAddon('addon-b', '1.0.0');
            engine.addEngine('lazy-engine-c', '1.0.0', { enableLazyLoading: true });
          },
        });
      },
    });

    fixturifyProject.writeSync();
    let project = fixturifyProject.buildProjectModel();

    project.initializeAddons();

    const pkgInfoAddonA = project.addons.find((addon) => addon.name === 'addon-a')._packageInfo;

    const pkgInfoLazyEngineB = project.addons
      .find((addon) => addon.name === 'addon-a')
      .addons.find((addon) => addon.name === 'lazy-engine-b')._packageInfo;

    const pkgInfoAddonB = project.addons
      .find((addon) => addon.name === 'addon-a')
      .addons.find((addon) => addon.name === 'lazy-engine-b')
      .addons.find((addon) => addon.name === 'addon-b')._packageInfo;

    const pkgInfoLazyEngineC = project.addons
      .find((addon) => addon.name === 'addon-a')
      .addons.find((addon) => addon.name === 'lazy-engine-b')
      .addons.find((addon) => addon.name === 'lazy-engine-c')._packageInfo;

    let { hostPackageInfo, hostAndAncestorBundledPackageInfos } = project.hostInfoCache.getHostAddonInfo(
      pkgInfoLazyEngineC
    );

    expect(hostPackageInfo).to.equal(pkgInfoLazyEngineB, 'host package-info for lazy-engine C is lazy engine B');
    expect(hostAndAncestorBundledPackageInfos).to.deep.equal(
      new Set([pkgInfoAddonA, pkgInfoAddonB]),
      'host packge-infos for lazy-engine C includes addon-a, addon-b'
    );
  });

  it('multiple lazy engines at same level with a common ancestor host', function () {
    fixturifyProject.addInRepoEngine('lazy-engine-a', '1.0.0', { enableLazyLoading: true });
    fixturifyProject.pkg['ember-addon'].paths = [];

    fixturifyProject.addInRepoEngine('lazy-engine-b', '1.0.0', {
      enableLazyLoading: true,
      callback: (engine) => {
        engine.pkg['ember-addon'].paths = ['../lazy-engine-a'];
      },
    });

    fixturifyProject.addInRepoEngine('lazy-engine-c', '1.0.0', {
      enableLazyLoading: true,
      callback: (engine) => {
        engine.pkg['ember-addon'].paths = ['../lazy-engine-a'];
      },
    });

    fixturifyProject.writeSync();
    let project = fixturifyProject.buildProjectModel();

    project.initializeAddons();

    const pkgInfoLazyEngineA = project.addons
      .find((addon) => addon.name === 'lazy-engine-b')
      .addons.find((addon) => addon.name === 'lazy-engine-a')._packageInfo;

    let { hostPackageInfo, hostAndAncestorBundledPackageInfos } = project.hostInfoCache.getHostAddonInfo(
      pkgInfoLazyEngineA
    );

    expect(hostPackageInfo).to.equal(project._packageInfo, 'host package-info for lazy-engine A is the project');
    expect(hostAndAncestorBundledPackageInfos).to.deep.equal(
      new Set([]),
      'host packge-infos for lazy-engine A has no non-lazy deps'
    );
  });
});
