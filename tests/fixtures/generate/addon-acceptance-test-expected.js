import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from 'my-addon/tests/helpers/start-app';

var application;

module('Acceptance | foo', {
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
    assert.equal(currentURL(), '/foo');
  });
});
