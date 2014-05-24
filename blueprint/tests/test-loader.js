/* globals requirejs,require */

// TODO: load based on params
Ember.keys(requirejs.entries).forEach(function(entry) {
  if ((/\-test/).test(entry)) {
    require(entry, null, null, true);
  }
});

QUnit.notifications({
  icons: {
    passed: '/assets/passed.png',
    failed: '/assets/failed.png'
  }
});
