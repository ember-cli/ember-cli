import Ember from 'ember';
import { initialize } from '<%= dependencyDepth %>/instance-initializers/<%= dasherizedModuleName %>';
import { module, test } from 'qunit';

var appInstance;

module('<%= friendlyTestName %>', {
  beforeEach: function() {
    Ember.run(function() {
      var application = Ember.Application.create();
      application.visit('/').then(function(instance) {
        appInstance = instance;
      });
    });
  }
});

// Replace this with your real tests.
test('it works', function(assert) {
  initialize(appInstance);

  // you would normally confirm the results of the initializer here
  assert.ok(true);
});
