'use strict';

/**
 * Tests for enabling and disabling per-bundle-addon-cache support
 */
const path = require('path');
const expect = require('chai').expect;

const projectRootPath = path.resolve(__dirname, '../../../..');
const Helpers = require(`${projectRootPath}/tests/helpers/per-bundle-addon-cache-helpers`);

function enablePerBundleAddonCache(explicitValue) {
  // default is opt-out
  if (explicitValue !== null && explicitValue !== undefined) {
    process.env.EMBER_CLI_ADDON_INSTANCE_CACHING = explicitValue;
  } else {
    delete process.env.EMBER_CLI_ADDON_INSTANCE_CACHING;
  }
}

function disablePerBundleAddonCache() {
  process.env.EMBER_CLI_ADDON_INSTANCE_CACHING = false;
}

function rerequire(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

// To test environment vars, we have to purge the require cache of 'Project' and 'PerBundleAddonCache' and rerequire it.
// For simplicity we'll do that here.
function createProject() {
  rerequire(`${projectRootPath}/lib/models/per-bundle-addon-cache`);
  const Project = rerequire(`${projectRootPath}/lib/models/project`);

  let fixture = Helpers.createStandardCacheFixture();
  let project = fixture.buildProjectModel(Project);
  return project;
}

describe('Unit | per-bundle-addon-cache enable caching', function () {
  it('perBundleAddonCache should be set in Project if EMBER_CLI_ADDON_INSTANCE_CACHING is not false', function () {
    enablePerBundleAddonCache('foo');
    let project = createProject();
    expect(project.perBundleAddonCache).to.exist;

    enablePerBundleAddonCache();
    project = createProject();
    expect(project.perBundleAddonCache).to.exist;
  });

  it('perBundleAddonCache should not be set in Project if EMBER_CLI_ADDON_INSTANCE_CACHING is false', function () {
    disablePerBundleAddonCache();
    let project = createProject();
    expect(project.perBundleAddonCache).not.to.exist;
  });
});
