import Ember from 'ember';
import startApp from '../helpers/start-app';

var App;

module('Acceptance: <%= classifiedModuleName %>', {
  setup: function() {
    App = startApp();
  },
  teardown: function() {
    Ember.run(App, 'destroy');
  }
});

test('visiting /<%= dasherizedModuleName %>', function() {
  visit('/<%= dasherizedModuleName %>');

  andThen(function() {
    equal(currentPath(), '<%= dasherizedModuleName %>');
  });
});
