import Ember from 'ember';
import { module, test } from 'qunit';
import { startApp, getAppInstance } from '../../tests/helpers/start-app';

module('Acceptance | foo', {
  setupOnce: function() {
    this.application = startApp();
  },

  setup: function() {
    this.appInstance = getAppInstance(this.application);
  },

  teardown: function() {
    Ember.run(this.appInstance, 'destroy');
  },

  teardownOnce: function() {
    Ember.run(this.application, 'destroy');
  }
});

test('visiting /foo', function(assert) {
  visit('/foo');

  andThen(function() {
    assert.equal(currentURL(), '/foo');
  });
});
