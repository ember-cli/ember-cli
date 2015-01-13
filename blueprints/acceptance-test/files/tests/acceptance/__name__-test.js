import Ember from 'ember';
import startApp from '../helpers/start-app';

var application;

module('Acceptance: <%= classifiedModuleName %>', {
  setup: function() {
    application = startApp();
  },
  teardown: function() {
    Ember.run(application, 'destroy');
  }
});

test('visiting /<%= dasherizedModuleName %>', function() {
  visit('/<%= dasherizedModuleName %>');

  andThen(function() {
    equal(currentPath(), '<%= dasherizedModuleName %>');
  });
});
