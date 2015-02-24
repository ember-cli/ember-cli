import Ember from 'ember';
import {
  module,
  test
} from 'qunit';
import startApp from 'my-app/tests/helpers/start-app';

var application;

module('Acceptance: Foo', {
  beforeEach: function() {
    application = startApp();
  },

  afterEach: function() {
    Ember.run(application, 'destroy');
  }
});

test('visiting /foo', function(assert) {
  visit('/foo');

  andThen(function() {
    assert.equal(currentPath(), 'foo');
  });
});
