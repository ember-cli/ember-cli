import Ember from 'ember';
import startApp from '../helpers/start-app';

var application;

module('Acceptance: Foo', {
  setup: function() {
    application = startApp();
  },
  teardown: function() {
    Ember.run(application, 'destroy');
  }
});

test('visiting /foo', function() {
  visit('/foo');

  andThen(function() {
    equal(currentPath(), 'foo');
  });
});
