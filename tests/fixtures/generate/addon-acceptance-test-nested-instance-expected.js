import Ember from 'ember';
import { module, test } from 'qunit';
import { startApp, getAppInstance } from '../../../tests/helpers/start-app';

module('Acceptance | foo/bar', {
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

test('visiting /foo/bar', function(assert) {
  visit('/foo/bar');

  andThen(function() {
    assert.equal(currentURL(), '/foo/bar');
  });
});
