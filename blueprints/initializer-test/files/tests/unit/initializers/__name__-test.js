import Ember from 'ember';
import { initialize } from '<%= dasherizedPackageName %>/initializers/<%= dasherizedModuleName %>';

var container, application;

module('<%= classifiedModuleName %>Initializer', {
  setup: function() {
    Ember.run(function() {
      container = new Ember.Container();
      application = Ember.Application.create();
      application.deferReadiness();
    });
  }
});

// Replace this with your real tests.
test('it works', function() {
  initialize(container, application);

  // you would normally confirm the results of the initializer here
  ok(true);
});

