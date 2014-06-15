import Ember from 'ember';
import startApp from '../helpers/start-app';

var App;

module('Acceptance: Foo', {
  setup: function() {
    App = startApp();
  },
  teardown: function() {
    Ember.run(App, 'destroy');
  }
});

test('visiting /foo', function() {
  visit('/foo');

  andThen(function() {
    equal(currentPath(), 'foo');
  });
});
