import {
  setupApplicationTest as upstreamSetupApplicationTest,
  setupRenderingTest,
  setupTest,
} from 'ember-qunit';

// This file exists to provide wrappers around ember-qunit's setup tests
// functions. This file lets you to wrap the setup helpers with your own
// functions. You can even create new test setup functions here as well!

let setupApplicationTest = function(hooks) {
  // This function is a wrapper around ember-qunit's setupApplicationTest.
  //
  // You can add application specific test setup code here. Maybe you need
  // to start mirage, pretender, or configure the beforeEach and afterEach
  // hooks with custom code.
  //
  // hooks.beforeEach(function() {
  //   // Setup your application tests here!
  // });

  // Remember, we still need to call the setupApplicationTest from ember-quint.
  upstreamSetupApplicationTest(hooks);
}

export {
  setupApplicationTest,
  setupRenderingTest,
  setupTest
}
