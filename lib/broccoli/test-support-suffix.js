runningTests = true;

if (typeof Testem !== 'undefined' && (typeof QUnit !== 'undefined' || typeof Mocha !== 'undefined')) {
  window.Testem.hookIntoTestFramework();
}

{{content-for 'test-support-suffix'}}
