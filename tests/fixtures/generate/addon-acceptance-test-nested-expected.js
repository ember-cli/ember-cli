import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from '../../../tests/helpers/start-app';

module('Acceptance | foo/bar', {
  beforeEach: function() {
    this.application = startApp();
  },

  afterEach: function() {
    Ember.run(this.application, 'destroy');
  }
});

test('visiting /foo/bar', function(assert) {
  visit('/foo/bar');

  andThen(function() {
    assert.equal(currentURL(), '/foo/bar');
  });
});
