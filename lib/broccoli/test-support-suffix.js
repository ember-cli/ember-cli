/* jshint ignore:start */

runningTests = true;

if (window.Testem) {
  window.Testem.hookIntoTestFramework();
}

{{content-for 'test-support-suffix'}}

/* jshint ignore:end */
