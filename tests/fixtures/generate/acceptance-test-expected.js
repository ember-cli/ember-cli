import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from 'my-app/tests/helpers/start-app';

module('Acceptance | foo', {
  beforeEach: function() {
    this.application = startApp();
  },

  afterEach: function() {
    Ember.run(this.application, 'destroy');
  }
});

test('visiting /foo', function(assert) {
  visit('/foo');

  andThen(function() {
    assert.equal(currentURL(), '/foo');
  });
});
