import Ember from 'ember';
import startApp from '../helpers/start-app';

var application;

QUnit.module('Acceptance: Foo', {
  beforeEach: function() {
    application = startApp();
  },

  afterEach: function() {
    Ember.run(application, 'destroy');
  }
});

QUnit.test('visiting /foo', function(assert) {
  visit('/foo');

  andThen(function() {
    assert.equal(currentPath(), 'foo');
  });
});
