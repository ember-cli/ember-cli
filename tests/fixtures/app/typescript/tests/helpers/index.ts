import {
  setupApplicationTest as upstreamSetupApplicationTest,
  setupRenderingTest as upstreamSetupRenderingTest,
  setupTest as upstreamSetupTest,
} from 'ember-qunit';

// This file exists to provide wrappers around ember-qunit's / ember-mocha's
// test setup functions. This way, you can easily extend the setup that is
// needed per test type.

function setupApplicationTest(
  hooks: Parameters<typeof upstreamSetupApplicationTest>[0],
  options?: Parameters<typeof upstreamSetupApplicationTest>[1]
) {
  upstreamSetupApplicationTest(hooks, options);

  // Additional setup for application tests can be done here.
  //
  // For example, if you need an authenticated session for each
  // application test, you could do:
  //
  // hooks.beforeEach(async function () {
  //   await authenticateSession(); // ember-simple-auth
  // });
  //
  // This is also a good place to call test setup functions coming
  // from other addons:
  //
  // setupIntl(hooks); // ember-intl
  // setupMirage(hooks); // ember-cli-mirage
}

function setupRenderingTest(
  hooks: Parameters<typeof upstreamSetupApplicationTest>[0],
  options?: Parameters<typeof upstreamSetupApplicationTest>[1]
) {
  upstreamSetupRenderingTest(hooks, options);

  // Additional setup for rendering tests can be done here.
}

function setupTest(
  hooks: Parameters<typeof upstreamSetupApplicationTest>[0],
  options?: Parameters<typeof upstreamSetupApplicationTest>[1]
) {
  upstreamSetupTest(hooks, options);

  // Additional setup for unit tests can be done here.
}

export { setupApplicationTest, setupRenderingTest, setupTest };
